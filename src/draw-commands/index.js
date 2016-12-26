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
import { laser } from './LaserPreview';
import { thickLines } from './thick-lines';

function image(regl) {
    return regl({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view;
            uniform vec3 translate;
            uniform vec2 size;
            attribute vec2 position;
            varying vec2 coord;
            void main() {
                coord = position;
                gl_Position = perspective * view * vec4(vec3(position * size, 0) + translate, 1);
            }`,
        frag: `
            precision mediump float;
            uniform sampler2D texture;
            uniform bool selected;
            varying vec2 coord;
            void main() {
                vec4 tex = texture2D(texture, vec2(coord.x, 1.0 - coord.y), 0.0);
                if(selected)
                    tex = mix(tex, vec4(0.0, 0.0, 1.0, 1.0), .5);
                gl_FragColor = tex;
            }`,
        attributes: {
            position: [[0, 0], [1, 0], [1, 1], [1, 1], [0, 1], [0, 0]],
        },
        uniforms: {
            translate: regl.prop('translate'),
            size: regl.prop('size'),
            texture: regl.prop('texture'),
            selected: regl.prop('selected'),
        },
        primitive: 'triangles',
        offset: 0,
        count: 6,
    });
}

export class DrawCommands {
    constructor(gl) {
        this.gl = gl;
        this.EXT_blend_minmax = gl.getExtension('EXT_blend_minmax');
        this.WEBGL_lose_context = gl.getExtension('WEBGL_lose_context');
        this.glBuffer = this.gl.createBuffer(); // !!! leak
        this.time = 0;
        this.uniforms = {};
        this.attributes = {};

        this.basic = basic(this);
        this.basic2d = basic2d(this);
        //this.image = image(this);
        this.thickLines = thickLines(this);
        //this.gcode = gcode(this);
        //this.laser = laser(this);
    }

    destroy() {
        this.WEBGL_lose_context.loseContext();
    }

    createBuffer(data) {
        let buffer = this.gl.createBuffer(); // !!! leak
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        return { buffer, isBuffer: true };
    }

    compile({vert, frag, attrs}) {
        let comp = (type, source) => {
            let shader = this.gl.createShader(type); // !!! leak
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
        let program = this.gl.createProgram(); // !!! leak
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
        for (let uniform of uniforms) {
            program[uniform.name + '_location'] = uniform.location;
            let set;
            switch (uniform.type) {
                case this.gl.BOOL:
                    set = 'drawCommands.gl.uniform1i(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT:
                    set = 'drawCommands.gl.uniform1f(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC2:
                    set = 'drawCommands.gl.uniform2fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC3:
                    set = 'drawCommands.gl.uniform3fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_VEC4:
                    set = 'drawCommands.gl.uniform4fv(this.' + uniform.name + '_location, ' + uniform.name + ');\n';
                    break;
                case this.gl.FLOAT_MAT4:
                    set = 'drawCommands.gl.uniformMatrix4fv(this.' + uniform.name + '_location, false, ' + uniform.name + ');\n';
                    break;
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

    execute({program, primitive, uniforms, buffer, attributes, next}) {
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

        if (next)
            return next(); // !!!
        useBuffer(() => {
            useProgram(() => {
                program.useUniforms(this, uniforms, () => {
                    program.useAttrs(this, buffer.stride, buffer.offset, () => {
                        let mode;
                        if (primitive === 'triangles')
                            mode = this.gl.TRIANGLES;
                        else if (primitive === 'lines')
                            mode = this.gl.LINES;
                        else if (primitive === 'line strip')
                            mode = this.gl.LINE_STRIP;
                        else
                            console.error('unknown primitive', primitive)
                        if (mode !== undefined)
                            this.gl.drawArrays(mode, 0, buffer.count);
                    });
                });
            });
        });
    }
};

export default DrawCommands;
