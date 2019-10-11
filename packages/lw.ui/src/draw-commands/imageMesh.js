// Copyright 2017 Todd Fleming
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

import { objectHasMatchingFields } from '../lib/util.js';
import { mat4 } from 'gl-matrix';

const drawStride = 5;

export function imageMesh(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 view; 
            attribute vec3 position;
            attribute vec2 samplePosition;
            varying vec2 vSamplePosition;
            void main() {
                vSamplePosition = samplePosition;
                gl_Position = perspective * view * vec4(position, 1);
            }`,
        frag: `
            precision mediump float;
            uniform sampler2D texture;
            varying vec2 vSamplePosition;
            void main() {
                gl_FragColor = texture2D(texture, vSamplePosition, 0.0);
            }`,
        attrs: {
            position: { offset: 0 },
            samplePosition: { offset: 12 },
        },
    });
    return ({ perspective, view, texture, data, offset, count }) => {
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { perspective, view, texture },
            buffer: {
                data: data,
                stride: drawStride * 4,
                offset: offset * drawStride * 4,
                count,
            },
        });
    };
}

export class CylImageMesh {
    constructor() {
        this.args = {};
        this.arrayVersion = 0;
    }

    initArray(args) {
        if (objectHasMatchingFields(this.args, args))
            return;
        this.arrayChanged = true;
        ++this.arrayVersion;

        let { x1, x2, diameter, numDivisions } = args;
        let array = new Float32Array(numDivisions * 6 * drawStride);
        let q = 0;
        for (let i = 0; i < numDivisions; ++i) {
            let a0 = i * 2 * Math.PI / numDivisions;
            let a1 = (i + 1) * 2 * Math.PI / numDivisions;

            array[q++] = x1;
            array[q++] = Math.sin(a0) * diameter / 2;
            array[q++] = Math.cos(a0) * diameter / 2;
            array[q++] = 0;
            array[q++] = i / numDivisions;

            array[q++] = x2;
            array[q++] = Math.sin(a0) * diameter / 2;
            array[q++] = Math.cos(a0) * diameter / 2;
            array[q++] = 1;
            array[q++] = i / numDivisions;

            array[q++] = x2;
            array[q++] = Math.sin(a1) * diameter / 2;
            array[q++] = Math.cos(a1) * diameter / 2;
            array[q++] = 1;
            array[q++] = (i + 1) / numDivisions;

            array[q++] = x2;
            array[q++] = Math.sin(a1) * diameter / 2;
            array[q++] = Math.cos(a1) * diameter / 2;
            array[q++] = 1;
            array[q++] = (i + 1) / numDivisions;

            array[q++] = x1;
            array[q++] = Math.sin(a1) * diameter / 2;
            array[q++] = Math.cos(a1) * diameter / 2;
            array[q++] = 0;
            array[q++] = (i + 1) / numDivisions;

            array[q++] = x1;
            array[q++] = Math.sin(a0) * diameter / 2;
            array[q++] = Math.cos(a0) * diameter / 2;
            array[q++] = 0;
            array[q++] = i / numDivisions;
        }
        this.array = array;
        this.args = args;
    }

    draw(drawCommands, perspective, view, x1, x2, diameter, numDivisions, texture) {
        if (this.drawCommands !== drawCommands) {
            this.drawCommands = drawCommands;
            if (this.buffer)
                this.buffer.destroy();
            this.buffer = null;
        }

        this.initArray({ x1, x2, diameter, numDivisions });
        if (!this.array)
            return;

        if (!this.buffer)
            this.buffer = drawCommands.createBuffer(this.array);
        else if (this.arrayChanged)
            this.buffer.setData(this.array);
        this.arrayChanged = false;

        drawCommands.imageMesh({
            perspective,
            view,
            texture,
            data: this.buffer,
            offset: 0,
            count: this.array.length / drawStride,
        });
    }
}; // CylImageMesh

