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

function image(regl) {
    return regl({
        vert: `
            precision mediump float;
            uniform mat4 perspective; 
            uniform mat4 world;
            uniform vec3 translate;
            uniform vec2 size;
            attribute vec2 position;
            varying vec2 coord;
            void main() {
                coord = position;
                gl_Position = perspective * world * vec4(vec3(position * size, 0) + translate, 1);
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
        attributes: {
            position: [[0, 0], [1, 0], [1, 1], [1, 1], [0, 1], [0, 0]],
        },
        uniforms: {
            translate: regl.prop('translate'),
            size: regl.prop('size'),
            texture: regl.prop('texture'),
            selected: regl.prop('selected'),
        },
        primitive: 'triangles',
        offset: 0,
        count: 6,
    });
}

export default class DrawCommands {
    constructor(regl) {
        this.regl = regl;
        this.camera = camera(regl);
        this.noDepth = noDepth(regl);
        this.simple = simple(regl);
        this.image = image(regl);
    }
};
