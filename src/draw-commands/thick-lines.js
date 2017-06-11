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

const drawStride = 7;

import { mat4 } from 'gl-matrix';

export function thickLines(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;

            uniform mat4 transform; 
            uniform float viewportWidth, viewportHeight, thickness;

            attribute vec3 p1, p2;
            attribute float vertex;

            varying vec2 vp1, vp2, vp;

            vec2 viewportCoord(vec3 p) {
                vec4 proj = transform * vec4(p, 1.0);
                float adj = fract(floor(thickness + 0.5) * 0.5);
                return vec2(
                    floor((proj.x / proj.w + 1.0) * 0.5 * (viewportWidth - 1.0) + 0.5) + adj,
                    floor((proj.y / proj.w + 1.0) * 0.5 * (viewportHeight - 1.0) + 0.5) + adj);
            }

            void main() {
                vp1 = viewportCoord(p1);
                vp2 = viewportCoord(p2);

                vec2 dir = thickness * 0.5 * normalize(vp2 - vp1);
                vec2 orth = vec2(-dir.y, dir.x);
                int v = int(vertex);
                if(v == 1)
                    vp = vp2 + dir - orth;
                else if(v == 2 || v == 3)
                    vp = vp2 + dir + orth;
                else if(v == 4)
                    vp = vp1 - dir + orth;
                else
                    vp = vp1 - dir - orth;
                gl_Position = vec4(vp.x * 2.0 / (viewportWidth - 1.0) - 1.0, vp.y * 2.0 / (viewportHeight - 1.0) - 1.0, 0.0, 1.0); 
            }`,
        frag: `
            precision mediump float;

            uniform float time, thickness;
            uniform vec4 color1;
            uniform vec4 color2;

            varying vec2 vp1, vp2, vp;

            void main() {
                float f = dot(vp - vp1, vp2 - vp1) / dot(vp2 - vp1, vp2 - vp1);
                if(f < 0.0 && dot(vp - vp1, vp - vp1) > thickness * 0.5 * thickness * 0.5)
                    discard;
                else if(f > 1.0 && dot(vp - vp2, vp - vp2) > thickness * 0.5 * thickness * 0.5)
                    discard;
                else if(mod(vp.x + vp.y - time * 32.0, 16.0) < 8.0)
                    gl_FragColor = color1;
                else
                    gl_FragColor = color2;
            }`,
        attrs: {
            p1: { offset: 0 },
            p2: { offset: 12 },
            vertex: { offset: 24 },
        },
    });
    let startTime = Date.now();
    return ({ perspective, view, transform2d, thickness, color1, color2, buffer }) => {
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
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: {
                transform,
                viewportWidth: drawCommands.gl.drawingBufferWidth,
                viewportHeight: drawCommands.gl.drawingBufferHeight,
                time: 0, // (Date.now() - startTime) / 1000,
                thickness,
                color1,
                color2,
            },
            buffer: {
                data: buffer,
                stride: drawStride * 4,
                offset: 0,
                count: buffer.length / drawStride,
            },
        });
    };
} // thickLines

// outline: [x, y,  x, y,  ...]
export function convertOutlineToThickLines(outline) {
    if (outline.length < 4)
        return [];
    let array = new Float32Array((outline.length - 2) / 2 * drawStride * 6);
    for (let i = 0; i < outline.length / 2 - 1; ++i) {
        let x1 = outline[i * 2 + 0];
        let y1 = outline[i * 2 + 1];
        let x2 = outline[i * 2 + 2];
        let y2 = outline[i * 2 + 3];

        for (let vertex = 0; vertex < 6; ++vertex) {
            array[i * drawStride * 6 + vertex * drawStride + 0] = x1;
            array[i * drawStride * 6 + vertex * drawStride + 1] = y1;
            array[i * drawStride * 6 + vertex * drawStride + 2] = 0;
            array[i * drawStride * 6 + vertex * drawStride + 3] = x2;
            array[i * drawStride * 6 + vertex * drawStride + 4] = y2;
            array[i * drawStride * 6 + vertex * drawStride + 5] = 0;
            array[i * drawStride * 6 + vertex * drawStride + 6] = vertex;
        }
    }
    return new Float32Array(array);
}
