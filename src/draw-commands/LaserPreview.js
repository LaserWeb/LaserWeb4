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

const parsedStride = 9;
const drawStride = 11;

export function laser(regl) {
    return regl({
        vert: `
            precision mediump float;

            uniform mat4 perspective; 
            uniform mat4 view;
            uniform float radius, g0Rate, simTime;

            attribute vec2 p1, p2;
            attribute float g, s, vertex, g0Dist0, g0Dist1, g1Time0, g1Time1;

            varying vec2 vp1, vp2, vp;
            varying float vg, vs;

            void main() {
                vg = g;
                vs = s;
                vp1 = p1;
                vp2 = p2;

                float time0 = g1Time0 + g0Dist0 / g0Rate;
                float time1 = g1Time1 + g0Dist1 / g0Rate;
                if(simTime < time0)
                    vg = 0.0;
                else if(simTime < time1)
                    vp2 = vp1 + (vp2 - vp1) * (simTime - time0) / (time1 - time0);

                vec2 dir = radius * normalize(vp2 - vp1);
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
                gl_Position = perspective * view * vec4(vp, 0.0, 1.0);
            }`,
        frag: `
            precision mediump float;

            uniform float radius, gcodeSMaxValue;

            varying vec2 vp1, vp2, vp;
            varying float vg, vs;

            void main() {
                float f = dot(vp - vp1, vp2 - vp1) / dot(vp2 - vp1, vp2 - vp1);
                if(vg == 0.0)
                    discard;
                else if(f < 0.0 && dot(vp - vp1, vp - vp1) > radius * radius)
                    discard;
                else if(f > 1.0 && dot(vp - vp2, vp - vp2) > radius * radius)
                    discard;
                else {
                    float s = 1.0 - clamp(vs / gcodeSMaxValue, 0.0, 1.0);
                    gl_FragColor = vec4(s, s, s, 1.0);
                }
            }`,
        attributes: {
            p1: {
                buffer: regl.prop('buffer'),
                offset: 0,
                stride: drawStride * 4,
            },
            p2: {
                buffer: regl.prop('buffer'),
                offset: 8,
                stride: drawStride * 4,
            },
            g: {
                buffer: regl.prop('buffer'),
                offset: 16,
                stride: drawStride * 4,
            },
            s: {
                buffer: regl.prop('buffer'),
                offset: 20,
                stride: drawStride * 4,
            },
            vertex: {
                buffer: regl.prop('buffer'),
                offset: 24,
                stride: drawStride * 4,
            },
            g0Dist0: {
                buffer: regl.prop('buffer'),
                offset: 28,
                stride: drawStride * 4,
            },
            g0Dist1: {
                buffer: regl.prop('buffer'),
                offset: 32,
                stride: drawStride * 4,
            },
            g1Time0: {
                buffer: regl.prop('buffer'),
                offset: 36,
                stride: drawStride * 4,
            },
            g1Time1: {
                buffer: regl.prop('buffer'),
                offset: 40,
                stride: drawStride * 4,
            },
        },
        uniforms: {
            g0Rate: regl.prop('g0Rate'),
            simTime: regl.prop('simTime'),
            radius: regl.prop('radius'),
            gcodeSMaxValue: regl.prop('gcodeSMaxValue'),
        },
        blend: {
            enable: true,
            equation: 'min',
        },
        primitive: 'triangle',
        offset: 0,
        count: regl.prop('count')
    });
} // laser

export class LaserPreview {
    setParsedGcode(parsed) {
        this.arrayChanged = true;
        if (parsed.length < 2 * parsedStride) {
            this.array = null;
        } else {
            let array = new Float32Array((parsed.length - parsedStride) / parsedStride * drawStride * 6);

            let g0Dist = 0, g1Time = 0;
            for (let i = 0; i < parsed.length / parsedStride - 1; ++i) {
                // g
                let x1 = parsed[i * parsedStride + 1];
                let y1 = parsed[i * parsedStride + 2];
                let z1 = parsed[i * parsedStride + 3];
                // e
                // f
                // a
                // s
                // t

                let g = parsed[i * parsedStride + 9];
                let x2 = parsed[i * parsedStride + 10];
                let y2 = parsed[i * parsedStride + 11];
                let z2 = parsed[i * parsedStride + 12];
                // e
                let f = parsed[i * parsedStride + 14];
                // a
                let s = parsed[i * parsedStride + 16];
                // t

                let g0Dist0 = g0Dist;
                let g1Time0 = g1Time;
                let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
                if (g)
                    g1Time += dist / f;
                else
                    g0Dist += dist;

                for (let vertex = 0; vertex < 6; ++vertex) {
                    array[i * drawStride * 6 + vertex * drawStride + 0] = x1;
                    array[i * drawStride * 6 + vertex * drawStride + 1] = y1;
                    array[i * drawStride * 6 + vertex * drawStride + 2] = x2;
                    array[i * drawStride * 6 + vertex * drawStride + 3] = y2;
                    array[i * drawStride * 6 + vertex * drawStride + 4] = g;
                    array[i * drawStride * 6 + vertex * drawStride + 5] = s;
                    array[i * drawStride * 6 + vertex * drawStride + 6] = vertex;
                    array[i * drawStride * 6 + vertex * drawStride + 7] = g0Dist0;
                    array[i * drawStride * 6 + vertex * drawStride + 8] = g0Dist;
                    array[i * drawStride * 6 + vertex * drawStride + 9] = g1Time0;
                    array[i * drawStride * 6 + vertex * drawStride + 10] = g1Time;
                }
            }
            this.array = array;
        }
    }

    draw(drawCommands, {diameter, gcodeSMaxValue, g0Rate, simTime}) {
        if (this.regl !== drawCommands.regl) {
            this.regl = drawCommands.regl;
            if (this.buffer)
                this.buffer.destroy();
            this.buffer = null;
        }

        if (!this.buffer)
            this.buffer = drawCommands.regl.buffer(this.array);
        else if (this.arrayChanged)
            this.buffer({ data: this.array });
        this.arrayChanged = false;

        if (this.array) {
            drawCommands.laser({
                buffer: this.buffer,
                count: this.array.length / drawStride,
                g0Rate,
                simTime,
                radius: diameter / 2,
                gcodeSMaxValue: gcodeSMaxValue,
            });
        }
    }
}; // LaserPreview
