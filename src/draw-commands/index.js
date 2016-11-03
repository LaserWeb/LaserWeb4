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

function camera(regl) {
    return regl({
        uniforms: {
            perspective: regl.prop('perspective'),
            world: regl.prop('world'),
        }
    });
}

function noDepth(regl) {
    return regl({
        depth: {
            enable: false,
        }
    });
}

function simple(regl) {
    return regl({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 world; 
            uniform vec3 translate; 
            attribute vec3 position;
            void main() {
                gl_Position = perspective * world * vec4(position + translate, 1);
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
            translate: regl.prop('translate'),
            color: regl.prop('color'),
        },
        primitive: regl.prop('primitive'),
        offset: regl.prop('offset'),
        count: regl.prop('count')
    });
}

export default class DrawCommands {
    constructor(regl) {
        this.regl = regl;
        this.camera = camera(regl);
        this.noDepth = noDepth(regl);
        this.simple = simple(regl);
    }
};
