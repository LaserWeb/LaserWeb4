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

import { gcode } from './GcodePreview';
import { laser } from './LaserPreview';
import { thickLines } from './thick-lines';

function camera(drawCommands) {
    let r = drawCommands.regl({
        uniforms: {
            perspective: drawCommands.regl.prop('perspective'),
            view: drawCommands.regl.prop('view'),
        }
    });
    return ({perspective, view}, next) => {
        drawCommands.execute({
            uniforms: { perspective, view },
            next: () => r({ perspective, view }, next),
        });
    };
}

function noDepth(regl) {
    return regl({
        depth: {
            enable: false,
        }
    });
}

function blendAlpha(regl) {
    return regl({
        blend: {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one minus src alpha',
                dstAlpha: 1
            },
        },
    });
}

function simple(regl) {
    return regl({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view; 
            uniform vec3 scale; 
            uniform vec3 translate; 
            attribute vec3 position;
            void main() {
                gl_Position = perspective * view * vec4(scale * position + translate, 1);
            }`,
        frag: `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }`,
        attributes: {
            position: regl.prop('position'),
        },
        uniforms: {
            scale: regl.prop('scale'),
            translate: regl.prop('translate'),
            color: regl.prop('color'),
        },
        primitive: regl.prop('primitive'),
        offset: regl.prop('offset'),
        count: regl.prop('count')
    });
}

function xsimple(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view; 
            uniform vec3 scale; 
            uniform vec3 translate; 
            attribute vec3 position;
            void main() {
                gl_Position = perspective * view * vec4(scale * position + translate, 1);
            }`,
        frag: `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }`,
    });
    return ({scale, translate, color, primitive, position, offset, count}, next) => {
        drawCommands.execute({
            program,
            primitive,
            uniforms: { scale, translate, color },
            buffer: {
                data: position,
                stride: 12,
                offset: offset * 12,
                count,
            },
            attributes: {
                position: { offset: 0 },
            },
            next,
        });
    };
}

function simple2d(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view; 
            uniform vec3 scale; 
            uniform vec3 translate; 
            attribute vec2 position;
            void main() {
                gl_Position = perspective * view * vec4(scale * vec3(position, 0.0) + translate, 1);
            }`,
        frag: `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }`,
    });
    return ({scale, translate, color, primitive, position, offset, count}, next) => {
        drawCommands.execute({
            program,
            primitive,
            uniforms: { scale, translate, color },
            buffer: {
                data: position,
                stride: 8,
                offset: offset * 8,
                count,
            },
            attributes: {
                position: { offset: 0 },
            },
            next,
        });
    };
}

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

export default class DrawCommands {
    constructor(regl) {
        this.regl = regl;
        this.gl = regl._gl;
        this.glBuffer = this.gl.createBuffer(); // !!! leak
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.time = 0;
        this.nest = 0;
        this.uniforms = {};
        this.attributes = {};

        this.camera = camera(this);
        this.noDepth = noDepth(regl);
        this.blendAlpha = blendAlpha(regl);
        this.simple = simple(regl);
        this.xsimple = xsimple(this);
        this.simple2d = simple2d(this);
        this.image = image(regl);
        this.thickLines = thickLines(this);
        this.gcode = gcode(regl);
        this.laser = laser(regl);
    }

    compile({vert, frag}) {
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
        let attributes = [];
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
            attributes.push({ name, size, type });
        }
        return { program, uniforms, attributes };
    }

    execute({program, primitive, uniforms, buffer, attributes, next}) {
        let useProgram = next => {
            let old = this.program;
            if (program) {
                this.program = program;
                this.gl.useProgram(program.program);
            }
            next();
            if (program) {
                this.program = old;
                this.gl.useProgram(old ? old.program : null);
            }
        };

        let addUniforms = next => {
            let old = this.uniforms;
            if (uniforms)
                this.uniforms = { ...old, ...uniforms };
            next();
            this.uniforms = old;
        };

        let addAttributes = next => {
            let old = this.attributes;
            if (attributes)
                this.attributes = { ...old, ...attributes };
            next();
            this.attributes = old;
        };

        let setBuffer = next => {
            let old = this.buffer;
            if (buffer)
                this.buffer = buffer;
            next();
            this.buffer = old;
        };

        let useUniforms = next => {
            for (let uniform of this.program.uniforms) {
                let v = this.uniforms[uniform.name];
                if (v === undefined) {
                    console.error('uniform', uniform.name, 'missing in', this.uniforms);
                    continue;
                }

                // if (uniform.value !== undefined && uniform.type !== this.gl.FLOAT_MAT4)
                //     continue; // !!!!!!!!!!!!!!

                switch (uniform.type) {
                    case this.gl.BOOL:
                        if (uniform.value !== v)
                            this.gl.uniform1i(uniform.location, v);
                        break;
                    case this.gl.FLOAT:
                        if (uniform.value !== v)
                            this.gl.uniform1f(uniform.location, v);
                        break;
                    case this.gl.FLOAT_VEC2:
                        if (!uniform.value || uniform.value[0] !== v[0] || uniform.value[1] !== v[1])
                            this.gl.uniform2fv(uniform.location, v);
                        break;
                    case this.gl.FLOAT_VEC3:
                        if (!uniform.value || uniform.value[0] !== v[0] || uniform.value[1] !== v[1] || uniform.value[2] !== v[2])
                            this.gl.uniform3fv(uniform.location, v);
                        break;
                    case this.gl.FLOAT_VEC4:
                        if (!uniform.value || uniform.value[0] !== v[0] || uniform.value[1] !== v[1] || uniform.value[2] !== v[2] || uniform.value[3] !== v[3])
                            this.gl.uniform4fv(uniform.location, v);
                        break;
                    case this.gl.FLOAT_MAT4:
                        let need = !uniform.value;
                        if (uniform.value)
                            for (let i = 0; i < 16; ++i)
                                if (uniform.value[i] !== v[i])
                                    need = true;
                        if (need) {
                            console.log('uniformMatrix4fv');
                            this.gl.uniformMatrix4fv(uniform.location, false, v);
                        }
                        break;
                    default:
                        console.error('uniform', uniform.name, 'type', uniform.type.toString(16), 'size', uniform.size, 'unhandled');
                }
                uniform.value = v;
            }
            next();
        };

        let useBuffer = next => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.buffer.data, this.gl.DYNAMIC_DRAW);
            next();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        };

        let useAttrs = next => {
            for (let i = 0; i < this.program.attributes.length; ++i) {
                let attr = this.program.attributes[i];
                let v = this.attributes[attr.name];
                if (v === undefined) {
                    console.error('attribute', uniform.name, 'missing');
                    continue;
                }
                this.gl.vertexAttribPointer(
                    i, attr.size, attr.type, false, this.buffer.stride, this.buffer.offset + v.offset);
                this.gl.enableVertexAttribArray(i);
            }
            next();
            for (let i = 0; i < this.program.attributes.length; ++i)
                this.gl.disableVertexAttribArray(i);
        };

        ++this.nest;
        useProgram(() => {
            addUniforms(() => {
                addAttributes(() => {
                    setBuffer(() => {
                        if (next)
                            return next();
                        if (!this.program || !this.buffer)
                            return;
                        useUniforms(() => {
                            useBuffer(() => {
                                useAttrs(() => {
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
                                        this.gl.drawArrays(mode, 0, this.buffer.count);
                                });
                            });
                        });
                    });
                });
            });
        });
        --this.nest;

        if (!this.nest)
            this.regl._refresh();
    }
};
