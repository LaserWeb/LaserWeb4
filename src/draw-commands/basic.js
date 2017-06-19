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

import { mat4 } from 'gl-matrix';

export function basic(drawCommands) {
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
        attrs: {
            position: { offset: 0 },
        },
    });
    return ({ perspective, view, scale, translate, color, primitive, position, offset, count }) => {
        drawCommands.execute({
            program,
            primitive,
            uniforms: { perspective, view, scale, translate, color },
            buffer: {
                data: position,
                stride: 12,
                offset: offset * 12,
                count,
            },
        });
    };
}

export function basic2d(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 transform; 
            attribute vec2 position;
            void main() {
                gl_Position = transform * vec4(position, 0.0, 1.0);
            }`,
        frag: `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }`,
        attrs: {
            position: { offset: 0 },
        },
    });
    return ({ perspective, view, transform2d, color, primitive, position, offset, count }) => {
        let t = transform2d;
        let transform =
            mat4.multiply([], perspective,
                mat4.multiply([], view, [
                    t[0], t[1], 0, 0,
                    t[2], t[3], 0, 0,
                    0, 0, 1, 0,
                    t[4], t[5], 0, 1]));
        drawCommands.execute({
            program,
            primitive,
            uniforms: { transform, color },
            buffer: {
                data: position,
                stride: 8,
                offset: offset * 8,
                count,
            },
        });
    };
}
