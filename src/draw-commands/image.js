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

export function image(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view;
            uniform vec3 location;
            uniform vec2 size;
            attribute vec2 position;
            varying vec2 coord;
            void main() {
                coord = position;
                gl_Position = perspective * view * vec4(vec3(position * size, 0) + location, 1);
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
        attrs: {
            position: { offset: 0 },
        },
    });
    let data = drawCommands.createBuffer(new Float32Array([0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0]));
    return ({perspective, view, location, size, texture, selected}) => {
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { perspective, view, location, size, texture, selected },
            buffer: {
                data,
                stride: 8,
                offset: 0,
                count: 6,
            },
        });
    };
}
