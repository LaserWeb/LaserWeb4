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
const drawStride = 7;

export function gcode(regl) {
    return regl({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 world;
            attribute vec3 position;
            attribute float g;
            attribute float t;
            attribute float g0Dist;
            attribute float g1Time;  
            varying vec4 color;
            varying float vg0Dist;
            varying float vg1Time;  
            void main() {
                gl_Position = perspective * world * vec4(position, 1);
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
        attributes: {
            g: {
                buffer: regl.prop('buffer'),
                offset: 0,
                stride: drawStride * 4,
            },
            position: {
                buffer: regl.prop('buffer'),
                offset: 4,
                stride: drawStride * 4,
            },
            t: {
                buffer: regl.prop('buffer'),
                offset: 16,
                stride: drawStride * 4,
            },
            g0Dist: {
                buffer: regl.prop('buffer'),
                offset: 20,
                stride: drawStride * 4,
            },
            g1Time: {
                buffer: regl.prop('buffer'),
                offset: 24,
                stride: drawStride * 4,
            },
        },
        uniforms: {
            g0Rate: regl.prop('g0Rate'),
            simTime: regl.prop('simTime'),
        },
        primitive: 'line',
        offset: 0,
        count: regl.prop('count')
    });
} // gcode

export class GcodePreview {
    setParsedGcode(parsed) {
        this.arrayChanged = true;
        if (parsed.length < 2 * parsedStride) {
            this.array = null;
            this.g0Dist = 0;
            this.g1Time = 0;
        } else {
            let array = new Float32Array((parsed.length - parsedStride) / parsedStride * drawStride * 2);

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
                // s
                let t = parsed[i * parsedStride + 8];

                array[i * drawStride * 2 + 0] = g;
                array[i * drawStride * 2 + 1] = x1;
                array[i * drawStride * 2 + 2] = y1;
                array[i * drawStride * 2 + 3] = z1;
                array[i * drawStride * 2 + 4] = t;
                array[i * drawStride * 2 + 5] = g0Dist;
                array[i * drawStride * 2 + 6] = g1Time;

                let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
                if (g)
                    g1Time += dist / f;
                else
                    g0Dist += dist;

                array[i * drawStride * 2 + 7] = g;
                array[i * drawStride * 2 + 8] = x2;
                array[i * drawStride * 2 + 9] = y2;
                array[i * drawStride * 2 + 10] = z2;
                array[i * drawStride * 2 + 11] = t;
                array[i * drawStride * 2 + 12] = g0Dist;
                array[i * drawStride * 2 + 13] = g1Time;
            }
            this.array = array;
            this.g0Dist = g0Dist;
            this.g1Time = g1Time;
        }
    }

    draw(drawCommands, {g0Rate, simTime}) {
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
            drawCommands.gcode({
                buffer: this.buffer,
                count: this.array.length / drawStride,
                g0Rate,
                simTime,
            });
        }
    }
}; // GcodePreview
