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

export function image(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 transform; 
            uniform vec2 size;
            attribute vec2 position;
            varying vec2 coord;
            void main() {
                coord = position;
                gl_Position = transform * vec4(position * size, 0, 1);
            }`,
        frag: `
            precision mediump float;
            uniform sampler2D texture;
            uniform bool selected;
            uniform float alpha;
            varying vec2 coord;
            void main() {
                vec4 tex = texture2D(texture, vec2(coord.x, 1.0 - coord.y), 0.0);
                if(selected)
                    tex = mix(tex, vec4(0.0, 0.0, 1.0, 1.0), .5);
                tex.a *= alpha;
                gl_FragColor = tex;
            }`,
        attrs: {
            position: { offset: 0 },
        },
    });
    let data = drawCommands.createBuffer(new Float32Array([0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0]));
    return ({ perspective, view, transform2d, texture, selected, alpha = 1 }) => {
        let t = transform2d;
        let transform =
            mat4.multiply([], perspective,
                mat4.multiply([], view, [
                    t[0], t[1], 0, 0,
                    t[2], t[3], 0, 0,
                    0, 0, 1, 0,
                    t[4], t[5], 0, 1]));
        let size = [texture.width, texture.height];
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { transform, size, texture, selected, alpha },
            buffer: {
                data,
                stride: 8,
                offset: 0,
                count: 6,
            },
        });
    };
}
