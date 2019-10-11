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
const drawStride = 8;

export function gcode(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view;
            uniform float rotaryScale;
            attribute vec4 position;
            attribute float g;
            attribute float t;
            attribute float g0Dist;
            attribute float g1Time;  
            varying vec4 color;
            varying float vg0Dist;
            varying float vg1Time;  
            void main() {
                gl_Position = perspective * view * vec4(position.x, position.y + position.a * rotaryScale, position.z, 1);
                if(g == 0.0)
                    color = vec4(0.0, 0.7, 0.0, 1.0);
                else if(t == 1.0)
                    color = vec4(0.0, 0.0, 1.0, 1.0);
                else if(t == 2.0)
                    color = vec4(0.5, 0.5, 0.0, 1.0);
                else if(t == 3.0)
                    color = vec4(1.0, 0.0, 1.0, 1.0);
                else if(t == 4.0)
                    color = vec4(0.0, 0.0, 0.0, 1.0);
                else if(t == 5.0)
                    color = vec4(0.0, 0.5, 0.7, 1.0);
                else
                    color = vec4(1.0, 0.0, 0.0, 1.0);
                vg0Dist = g0Dist;
                vg1Time = g1Time;
            }`,
        frag: `
            precision mediump float;
            uniform float g0Rate;
            uniform float simTime;
            varying vec4 color;
            varying float vg0Dist;
            varying float vg1Time;
            void main() {
                float time = vg1Time + vg0Dist / g0Rate;
                if(time > simTime)
                    discard;
                else
                    gl_FragColor = color;
            }`,
        attrs: {
            g: { offset: 0, },
            position: { offset: 4, },
            t: { offset: 20, },
            g0Dist: { offset: 24, },
            g1Time: { offset: 28, },
        },
    });
    return ({ perspective, view, g0Rate, simTime, rotaryDiameter, data, count }) => {
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.LINES,
            uniforms: { perspective, view, g0Rate, simTime, rotaryScale: rotaryDiameter * Math.PI / 360 },
            buffer: {
                data,
                stride: drawStride * 4,
                offset: 0,
                count,
            },
        });
    };
} // gcode

export class GcodePreview {
    constructor() {
        this.arrayVersion = 0;
    }

    setParsedGcode(parsed) {
        this.arrayChanged = true;
        ++this.arrayVersion;
        if (parsed.length < 2 * parsedStride) {
            this.array = null;
            this.g0Dist = 0;
            this.g1Time = 0;
        } else {
            let array = new Float32Array((parsed.length - parsedStride) / parsedStride * drawStride * 2);
            this.minX = Number.MAX_VALUE;
            this.maxX = -Number.MAX_VALUE;
            this.minY = Number.MAX_VALUE;
            this.maxY = -Number.MAX_VALUE;
            this.minA = Number.MAX_VALUE;
            this.maxA = -Number.MAX_VALUE;

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
                // s
                let t = parsed[i * parsedStride + 8];

                this.minX = Math.min(this.minX, x1, x2);
                this.maxX = Math.max(this.maxX, x1, x2);
                this.minY = Math.min(this.minY, y1, y2);
                this.maxY = Math.max(this.maxY, y1, y2);
                this.minA = Math.min(this.minA, a1, a2);
                this.maxA = Math.max(this.maxA, a1, a2);

                array[i * drawStride * 2 + 0] = g;
                array[i * drawStride * 2 + 1] = x1;
                array[i * drawStride * 2 + 2] = y1;
                array[i * drawStride * 2 + 3] = z1;
                array[i * drawStride * 2 + 4] = a1;
                array[i * drawStride * 2 + 5] = t;
                array[i * drawStride * 2 + 6] = g0Dist;
                array[i * drawStride * 2 + 7] = g1Time;

                let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
                if (g)
                    g1Time += dist / f;
                else
                    g0Dist += dist;

                array[i * drawStride * 2 + 8] = g;
                array[i * drawStride * 2 + 9] = x2;
                array[i * drawStride * 2 + 10] = y2;
                array[i * drawStride * 2 + 11] = z2;
                array[i * drawStride * 2 + 12] = a2;
                array[i * drawStride * 2 + 13] = t;
                array[i * drawStride * 2 + 14] = g0Dist;
                array[i * drawStride * 2 + 15] = g1Time;
            }
            this.array = array;
            this.g0Dist = g0Dist;
            this.g1Time = g1Time;
        }
    }

    draw(drawCommands, perspective, view, g0Rate, simTime, rotaryDiameter) {
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

        drawCommands.gcode({
            perspective,
            view,
            g0Rate,
            simTime,
            rotaryDiameter,
            data: this.buffer,
            count: this.array.length / drawStride,
        });
    }
}; // GcodePreview
