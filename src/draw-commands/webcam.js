
export const pipeImageCommand = (regl) =>{ 
    return regl({
        vert: `
            precision mediump float;
            attribute vec2 position;
            varying vec2 uv;
            uniform float flipX;
            uniform float flipY;
            void main () {
                uv = position;
                gl_Position = vec4(flipX + 2.0 * position.x, flipY + 2.0 * position.y, 0, 1);
            }
        `,
        frag: `
            precision mediump float;
            uniform sampler2D texture;
            varying vec2 uv;
            void main () {
                gl_FragColor = texture2D(texture, uv);
            }
        `,
        attributes: {
            position: [
                -2, 0,
                0, -2,
                2, 2
            ]
        },
        framebuffer: regl.prop('dest'),
        uniforms: {
            texture: regl.prop('src'),
            flipX: regl.prop('flipX')? -1 : 1,
            flipY: regl.prop('flipY')? -1 : 1
        },
        depth: {enable: false},
        count: 3
    });
}

export const barrelDistortCommand = (regl) => {


    return regl({
            frag: `
            #ifdef GL_ES
            precision highp float;
            #endif

            uniform vec4 uLens;
            uniform vec2 uFov;

            uniform sampler2D uSampler;

            varying vec3 vPosition;
            varying vec2 vTextureCoord;

            vec2 GLCoord2TextureCoord(vec2 glCoord) {
                return glCoord  * vec2(1.0, -1.0)/ 2.0 + vec2(0.5, 0.5);
            }

            void main(void){
                float scale = uLens.w;
                float F = uLens.z;
                
                float L = length(vec3(vPosition.xy/scale, F));

                vec2 vMapping = vPosition.xy * F / L;
                vMapping = vMapping * uLens.xy;

                vMapping = GLCoord2TextureCoord(vMapping/scale);

                vec4 texture = texture2D(uSampler, vMapping);
                if(vMapping.x > 0.99 || vMapping.x < 0.01 || vMapping.y > 0.99 || vMapping.y < 0.01){
                    texture = vec4(0.0, 0.0, 0.0, 1.0);
                } 
                gl_FragColor = texture;
            }
            `,
            vert: `
            #ifdef GL_ES
            precision highp float;
            #endif

            attribute vec3 aVertexPosition;

            attribute vec2 aTextureCoord;

            varying vec3 vPosition;
            varying vec2 vTextureCoord;

            void main(void){
                vPosition = aVertexPosition;
                vTextureCoord = aTextureCoord;

                gl_Position = vec4(vPosition,1.0);
            }
            `,
            attributes: {
                aVertexPosition: regl.buffer([
                    -1.0, -1.0, 0.0,
                    1.0, -1.0, 0.0,
                    1.0, 1.0, 0.0,
                    -1.0, 1.0, 0.0
                ]),
                aTextureCoord: regl.buffer([
                    0.0, 0.0,
                    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0
                ])
            },
            uniforms: {
                uLens: regl.prop('lens'),
                uFov: regl.prop('fov'),
                uSampler: regl.prop('src')
            },
            elements : regl.elements([
                [0, 1, 2],
                [0, 2, 3],
                [2, 1, 0],
                [3, 2, 0]
            ]),
            framebuffer: regl.prop('dest')

    })
 
}

export const computePerspectiveMatrix = (src, before, after) => {

    let getSquareToQuad = (x0, y0, x1, y1, x2, y2, x3, y3) => {
        var dx1 = x1 - x2;
        var dy1 = y1 - y2;
        var dx2 = x3 - x2;
        var dy2 = y3 - y2;
        var dx3 = x0 - x1 + x2 - x3;
        var dy3 = y0 - y1 + y2 - y3;
        var det = dx1*dy2 - dx2*dy1;
        var a = (dx3*dy2 - dx2*dy3) / det;
        var b = (dx1*dy3 - dx3*dy1) / det;
        return [
            x1 - x0 + a*x1, y1 - y0 + a*y1, a,
            x3 - x0 + b*x3, y3 - y0 + b*y3, b,
            x0, y0, 1
        ];
    }

    let getInverse = (m) => {
        var a = m[0], b = m[1], c = m[2];
        var d = m[3], e = m[4], f = m[5];
        var g = m[6], h = m[7], i = m[8];
        var det = a*e*i - a*f*h - b*d*i + b*f*g + c*d*h - c*e*g;
        return [
            (e*i - f*h) / det, (c*h - b*i) / det, (b*f - c*e) / det,
            (f*g - d*i) / det, (a*i - c*g) / det, (c*d - a*f) / det,
            (d*h - e*g) / det, (b*g - a*h) / det, (a*e - b*d) / det
        ];
    }

    let multiply = (a, b) => {
        return [
            a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
            a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
            a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
            a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
            a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
            a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
            a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
            a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
            a[6]*b[2] + a[7]*b[5] + a[8]*b[8]
        ];
    }

    let perspective = (before, after)=>{
        let a = getSquareToQuad.apply(null, after);
        let b = getSquareToQuad.apply(null, before);
        let c = multiply(getInverse(a), b);   
        let matrix = Array.prototype.concat.apply([], c); 
        if (matrix.length === 4) {
            matrix = [
                matrix[0], matrix[1], 0,
                matrix[2], matrix[3], 0,
                0, 0, 1
            ];
        } else if (matrix.length !== 9) {
            console.error('can only warp with 2x2 or 3x3 matrix');
        }
        return matrix;
    }

    return perspective(before, after)
}

export const perspectiveDistortCommand = (regl) => {

   return regl({
            frag: `
                precision highp float;
                uniform mat3 matrix;
                uniform bool useTextureSpace;
                uniform sampler2D texture;
                uniform vec2 texSize;
                varying vec2 texCoord;
                void main() {
                    vec2 coord = texCoord * texSize;
                    
                    if (useTextureSpace) coord = coord / texSize * 2.0 - 1.0;
                    vec3 warp = matrix * vec3(coord, 1.0);
                    coord = warp.xy / warp.z;
                    if (useTextureSpace) coord = (coord * 0.5 + 0.5) * texSize;

                    gl_FragColor = texture2D(texture, coord / texSize);
                    vec2 clampedCoord = clamp(coord, vec2(0.0), texSize);
                    if (coord != clampedCoord) {
                        gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));
                    }
                }
            `,
            vert:`
                precision mediump float;
                attribute vec2 position;
                varying vec2 texCoord;
                void main () {
                    texCoord = position;
                    gl_Position = vec4( -1.0 + 2.0 * position.x, -1.0 + 2.0 * position.y, 0, 1);
                    
                }
            `,
            attributes:{
                position:  [
                    0.0, 0.0,
                    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0
            ]
            },
            uniforms:{
                matrix: regl.prop('matrix'),
                texture: regl.prop('src'),
                texSize: regl.prop('size'),
                useTextureSpace: false
            },
            count:6,
            framebuffer: regl.prop('dest')
        })
}
