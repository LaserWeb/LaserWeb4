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
const drawStride = 13;

export function laser(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;

            uniform mat4 perspective; 
            uniform mat4 view;
            uniform float radius, g0Rate, simTime;
            uniform float rotaryScale;

            attribute vec2 p1, p2;
            attribute float a1, a2;
            attribute float g, s, vertex, g0Dist0, g0Dist1, g1Time0, g1Time1;

            varying vec2 vp1, vp2, vp;
            varying float vg, vs;

            void main() {
                vg = g;
                vs = s;
                vp1 = vec2(p1.x, p1.y + a1 * rotaryScale);
                vp2 = vec2(p2.x, p2.y + a2 * rotaryScale);

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
        attrs: {
            p1: { offset: 0 },
            a1: { offset: 8 },
            p2: { offset: 12 },
            a2: { offset: 20 },
            g: { offset: 24 },
            s: { offset: 28 },
            vertex: { offset: 32 },
            g0Dist0: { offset: 36 },
            g0Dist1: { offset: 40 },
            g1Time0: { offset: 44 },
            g1Time1: { offset: 48 },
        },
    });
    return ({ perspective, view, g0Rate, simTime, rotaryDiameter, radius, gcodeSMaxValue, data, count }) => {
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { perspective, view, g0Rate, simTime, rotaryScale: rotaryDiameter * Math.PI / 360, radius, gcodeSMaxValue },
            buffer: {
                data,
                stride: drawStride * 4,
                offset: 0,
                count,
            },
        });
    };
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
                let a1 = parsed[i * parsedStride + 6];
                // s
                // t

                let g = parsed[i * parsedStride + 9];
                let x2 = parsed[i * parsedStride + 10];
                let y2 = parsed[i * parsedStride + 11];
                let z2 = parsed[i * parsedStride + 12];
                // e
                let f = parsed[i * parsedStride + 14];
                let a2 = parsed[i * parsedStride + 15];
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
                    array[i * drawStride * 6 + vertex * drawStride + 2] = a1;
                    array[i * drawStride * 6 + vertex * drawStride + 3] = x2;
                    array[i * drawStride * 6 + vertex * drawStride + 4] = y2;
                    array[i * drawStride * 6 + vertex * drawStride + 5] = a2;
                    array[i * drawStride * 6 + vertex * drawStride + 6] = g;
                    array[i * drawStride * 6 + vertex * drawStride + 7] = s;
                    array[i * drawStride * 6 + vertex * drawStride + 8] = vertex;
                    array[i * drawStride * 6 + vertex * drawStride + 9] = g0Dist0;
                    array[i * drawStride * 6 + vertex * drawStride + 10] = g0Dist;
                    array[i * drawStride * 6 + vertex * drawStride + 11] = g1Time0;
                    array[i * drawStride * 6 + vertex * drawStride + 12] = g1Time;
                }
            }
            this.array = array;
        }
    }

    draw(drawCommands, perspective, view, diameter, gcodeSMaxValue, g0Rate, simTime, rotaryDiameter) {
        if (this.drawCommands !== drawCommands) {
            this.drawCommands = drawCommands;
            if (this.buffer)
                this.buffer.destroy();
            this.buffer = null;
        }

        if (!this.array)
            return;

        if (!this.buffer)
            this.buffer = drawCommands.createBuffer(this.array);
        else if (this.arrayChanged)
            this.buffer.setData(this.array);
        this.arrayChanged = false;

        drawCommands.laser({
            perspective,
            view,
            g0Rate,
            simTime,
            rotaryDiameter,
            radius: diameter / 2,
            gcodeSMaxValue: gcodeSMaxValue,
            data: this.buffer,
            count: this.array.length / drawStride,
        });
    }
}; // LaserPreview
