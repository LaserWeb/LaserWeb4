// Copyright 2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { basic, basic2d } from './basic';
import { gcode } from './GcodePreview';
import { image } from './image';
import { laser } from './LaserPreview';
import { thickLines } from './thick-lines';

import { barrelDistort } from './webcamfx';

export class DrawCommands {
    constructor(gl) {
        this.gl = gl;
        this.EXT_blend_minmax = gl.getExtension('EXT_blend_minmax');
        this.WEBGL_lose_context = gl.getExtension('WEBGL_lose_context');
        this.glBuffer = this.gl.createBuffer();
        this.buffers = [this.glBuffer];
        this.textures = [];
        this.frameBuffers = [];
        this.shaders = [];
        this.programs = [];

        this.basic = basic(this);
        this.basic2d = basic2d(this);
        this.image = image(this);
        this.thickLines = thickLines(this);
        this.gcode = gcode(this);
        this.laser = laser(this);

        this.barrelDistort = barrelDistort(this)

    }

    destroy() {
        for (let buffer of this.buffers)
            this.gl.deleteBuffer(buffer);
        for (let texture of this.textures)
            this.gl.deleteTexture(texture);
        for (let program of this.programs)
            this.gl.deleteProgram(program);
        for (let frameBuffer of this.frameBuffers)
            this.gl.deleteFramebuffer(frameBuffer);
        for (let shader of this.shaders)
            this.gl.deleteShader(shader);
        if (this.WEBGL_lose_context)
            this.WEBGL_lose_context.loseContext();
    }

    createBuffer(data) {
        let buffer = this.gl.createBuffer();
        this.buffers.push(buffer);
        let result = {
            buffer,
            isBuffer: true,
            drawCommands: this,
            setData(data) {
                this.drawCommands.gl.bindBuffer(this.drawCommands.gl.ARRAY_BUFFER, buffer);
                this.drawCommands.gl.bufferData(this.drawCommands.gl.ARRAY_BUFFER, data, this.drawCommands.gl.STATIC_DRAW);
                this.drawCommands.gl.bindBuffer(this.drawCommands.gl.ARRAY_BUFFER, null);
            },
            destroy() {
                this.drawCommands.gl.deleteBuffer(this.buffer);
            },
        };
        result.setData(data);
        return result;
    }

    createTexture(props) {
        let texture = this.gl.createTexture();
        this.textures.push(texture);
        let result = {
            texture,
            drawCommands: this,
            set({image, width, height}) {
                let gl = this.drawCommands.gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                if (image)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                else
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
            },
            destroy() {
                this.drawCommands.gl.deleteTexture(this.texture);
            },
        };
        result.set(props);
        return result;
    }

    createFrameBuffer(width, height) {
        let frameBuffer = this.gl.createFramebuffer();
        this.frameBuffers.push(frameBuffer);
        let texture = this.createTexture({ width, height });
        let result = {
            width, height,
            frameBuffer,
            texture,
            resize(width, height) {
                this.texture.set({ width, height });
            },
            destroy() {
                this.drawCommands.gl.deleteFramebuffer(this.frameBuffer);
                this.texture.destroy();
            },
        };
        this.useFrameBuffer(result, () => {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture.texture, 0);
        });
        return result;
    }

    useFrameBuffer(frameBuffer, next) {
        let old = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer.frameBuffer);
        next();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, old);
    }

    compile({vert, frag, attrs}) {
        let comp = (type, source) => {
            let shader = this.gl.createShader(type);
            this.shaders.push(shader);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
                return shader;
            else
                console.error(this.gl.getShaderInfoLog(shader));
        }
        let v = comp(this.gl.VERTEX_SHADER, vert);
        let f = comp(this.gl.FRAGMENT_SHADER, frag);
        if (!v || !f)
            return;
        let program = this.gl.createProgram();
        this.programs.push(program);
        this.gl.attachShader(program, v);
        this.gl.attachShader(program, f);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('shader link failed');
            return;
        }
        let numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        let uniforms = [];
        for (let i = 0; i < numUniforms; ++i) {
            let {name, size, type} = this.gl.getActiveUniform(program, i);
            uniforms.push({ name, size, type, location: this.gl.getUniformLocation(program, name) });
        }
        let numAttrs = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        let result = { program, uniforms, attrs: [] };
        for (let i = 0; i < numAttrs; ++i) {
            let {name, size, type} = this.gl.getActiveAttrib(program, i);
            if (type == this.gl.FLOAT_VEC2) {
                type = this.gl.FLOAT;
                size = 2;
            }
            else if (type == this.gl.FLOAT_VEC3) {
                type = this.gl.FLOAT;
                size = 3;
            }
            let attr = attrs[name];
            if (!attr) {
                console.error('missing attr', name);
                return;
            }
            result.attrs.push({ ...attr, name, size, type });
        }
        this.generateUseUniforms(result);
        this.generateUseAttrs(result);
        return result;
    }

    generateUseUniforms(program) {
        let {uniforms} = program;
        let body = 'let {' + uniforms.map(u => u.name) + '} = props;\n';
        body += 'let gl = drawCommands.gl;\n';
        let numTextures = 0;
        for (let uniform of uniforms) {
            program[uniform.name + '_location'] = uniform.location;
            let set;
            switch (uniform.type) {
                case this.gl.BOOL:
                    set = 'gl.uniform1i(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT:
                    set = 'gl.uniform1f(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC2:
                    set = 'gl.uniform2fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC3:
                    set = 'gl.uniform3fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC4:
                    set = 'gl.uniform4fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_MAT4:
                    set = 'gl.uniformMatrix4fv(this.' + uniform.name + '_location, false, ' + uniform.name + ');\n';
                    break;
                case this.gl.SAMPLER_2D:
                    body += 'gl.activeTexture(' + (this.gl.TEXTURE0 + numTextures) + ');\n';
                    body += 'gl.bindTexture(gl.TEXTURE_2D, ' + uniform.name + '.texture);\n';
                    body += 'gl.uniform1i(this.' + uniform.name + '_location, ' + numTextures + ');\n';
                    ++numTextures;
                    continue;
                default:
                    console.error('uniform', uniform.name, 'type', uniform.type.toString(16), 'size', uniform.size, 'unhandled');
                    continue;
            }
            // body += 'console.log(this);\n';
            // body += 'console.log(this.uniforms, "' + uniform.name + '");\n';
            // body += 'console.log(this.' + uniform.name + '_location);\n';
            body += 'if (' + uniform.name + ' !== this.' + uniform.name + ') {\n';
            body += '    ' + set;
            body += '    this.' + uniform.name + ' = ' + uniform.name + ';\n';
            body += '}\n';
        }
        body += 'next();\n';
        for (let i = 0; i < numTextures; ++i) {
            body += 'drawCommands.gl.activeTexture(' + (this.gl.TEXTURE0 + i) + ');\n';
            body += 'drawCommands.gl.bindTexture(gl.TEXTURE_2D, null);\n';
        }
        //console.log(body);
        program.useUniforms = new Function('drawCommands', 'props', 'next', body);
    }

    generateUseAttrs(program) {
        let {attrs} = program;
        let setup = '';
        let teardown = '';
        for (let i = 0; i < attrs.length; ++i) {
            let attr = attrs[i];
            setup += 'drawCommands.gl.vertexAttribPointer(' + i + ', ' + attr.size + ', ' + attr.type + ', false, stride, offset + ' + attr.offset + ');\n';
            setup += 'drawCommands.gl.enableVertexAttribArray(' + i + ');\n';
            teardown += 'drawCommands.gl.disableVertexAttribArray(' + i + ');\n';
        }
        let body = setup + 'next();\n' + teardown;
        //console.log(body);
        program.useAttrs = new Function('drawCommands', 'stride', 'offset', 'next', body);
    }

    execute({program, primitive, uniforms, buffer, attributes}) {
        let useBuffer = next => {
            if (buffer.data.isBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.data.buffer);
                next();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            } else {
                if (!buffer.data.length)
                    return;
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer.data, this.gl.DYNAMIC_DRAW);
                next();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            }
        };

        let useProgram = next => {
            this.gl.useProgram(program.program);
            next();
            this.gl.useProgram(null);
        };

        useBuffer(() => {
            useProgram(() => {
                program.useUniforms(this, uniforms, () => {
                    program.useAttrs(this, buffer.stride, buffer.offset, () => {
                        this.gl.drawArrays(primitive, 0, buffer.count);
                    });
                });
            });
        });
    } // execute
}; // DrawCommands

export default DrawCommands;
