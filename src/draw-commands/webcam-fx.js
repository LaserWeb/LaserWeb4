export function pipeImage(drawCommands) {
    let program = drawCommands.compile({
        vert: `
            precision mediump float;
            attribute vec2 aPosition;
            varying vec2 uv;
            uniform float flipX;
            uniform float flipY;
            void main () {
                uv = aPosition;
                gl_Position = vec4(flipX + 2.0 * aPosition.x, flipY + 2.0 * aPosition.y, 0, 1);
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
        attrs: {
            aPosition: [
                -2, 0,
                0, -2,
                2, 2
            ]
        },
    });

    let data = drawCommands.createBuffer(new Float32Array([-2, 0, 0, -2, 2, 2]));

    return ({texture, flipX, flipY}) => {
        drawCommands.execute({
            program,
            primitive:drawCommands.gl.TRIANGLES,
            uniforms: { 
                texture,
                flipX: flipX? -1.0 : 1.0,
                flipY: flipY? -1.0 : 1.0
            },
            buffer: {
                data,
                stride: 8,
                offset: 0,
                count: 3,
            },
        });
    };
}


export function webcamFX(drawCommands) {
    let program = drawCommands.compile({
        frag: `
            #ifdef GL_ES
            precision highp float;
            #endif

            uniform vec3 uInputcorrection;
            uniform vec3 uLens;

            uniform vec2 p0;
            uniform vec2 p1;
            uniform vec2 p2;
            uniform vec2 p3;
            uniform bool perspective;

            uniform sampler2D uSampler;

            varying vec3 vPosition;
            varying vec2 vTextureCoord;


            ///////////////////////////
            // useful functions

            // linearlly map [-1, s, 1] to [A, output, B]
            vec2 TraceLine(float s, vec2 A, vec2 B) {
                return vec2((B.x - A.x)*(s * 0.5 + 0.5 ) + A.x,
                            (B.y - A.y)*(s * 0.5 + 0.5 ) + A.y);
            }

            // map the interval [-1, 1] to [0, 1] in both dimensions
            vec2 GLCoord2TextureCoord(vec2 glCoord) {
                return glCoord  * vec2(1.0, 1.0)/ 2.0 + vec2(0.5, 0.5);
            }

            // find the intersection of AB and CD
            vec2 Intersect(vec2 A, vec2 B, vec2 C, vec2 D) {
                float d = ((A.x-B.x)*(C.y-D.y)-(A.y-B.y)*(C.x-D.x));
                if (d == 0.0) {
                    return vec2(0.0, 0.0); // denote parallel lines (shouldn't happen)
                } else {
                    return vec2(((A.x*B.y-A.y*B.x)*(C.x-D.x)-(A.x-B.x)*(C.x*D.y-C.y*D.x))/d,
                                ((A.x*B.y-A.y*B.x)*(C.y-D.y)-(A.y-B.y)*(C.x*D.y-C.y*D.x))/d);
                }
            }
            ///////////////////////////

            void main(void){

                vec2 vMapping = vec2(vPosition.x, vPosition.y);

                float angle = uInputcorrection.x;
                float aspect = uInputcorrection.y;
                float scale = uInputcorrection.z;
                float F = 1.0/uLens.x;
                float r1 = uLens.y;
                float r2 = uLens.z;
                float er1 = exp(r1);
                float er2 = exp(r2);

                // correct for perspective effects in y only
                // this is hackish (not fully general, but for Darkly should work)
                if (perspective) {
                    vMapping.y = (vMapping.y + 1.0) / 2.0; // map to interval [0,1]
                    vMapping.y = (vMapping.y) * (r2 - r1) + r1; // map to interval [r1, r2]
                    vMapping.y = exp(vMapping.y);
                    vMapping.y = (vMapping.y - er1) / (er2 - er1); // map from interval [exp(r1), exp(r2)] to [0, 1]
                    vMapping.y = (vMapping.y * 2.0) - 1.0; // map to interavl [-1, 1]
                }

                // naive perspective
                vec2 xintup = TraceLine(vMapping.x, p1, p2); // x-intercept on upper boundary
                vec2 xintdn = TraceLine(vMapping.x, p0, p3); // x-intercept on lower boundary
                vec2 yintlf = TraceLine(vMapping.y, p1, p0); // y-intercept on left boundary
                vec2 yintrt = TraceLine(vMapping.y, p2, p3); // y-intercept on right boundary

                vMapping = Intersect(xintup, xintdn, yintlf, yintrt);

                // scale correction
                vMapping = vec2(
                    vMapping.x / scale,
                    vMapping.y / scale
                );

                // Lens correction
                float L = length(vec3(vMapping.x, vMapping.y, F));
                vMapping = vMapping / L * F;

                // aspect
                vMapping = vec2(
                    vMapping.x / aspect,
                    vMapping.y * aspect
                );

                // Rotate the position
                vec2 sincos = vec2(sin(angle), cos(angle));
                vMapping = vec2(
                    vMapping.x * sincos.y - vMapping.y * sincos.x,
                    vMapping.x * sincos.x + vMapping.y * sincos.y
                );

                // given coordinates in world frame, get pixel coordinates
                // on texture to look up color from
                vMapping = GLCoord2TextureCoord(vMapping);

                // look up the color for the specified coordinates in the texture
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

            varying vec3 vPosition; // shared with
            varying vec2 vTextureCoord; // shared with fragment shader

            void main(void){
                vPosition = aVertexPosition;
                vTextureCoord = aTextureCoord;

                gl_Position = vec4(aVertexPosition.xy, 0.0,1.0);
            }
            `,
        attrs: {
            aVertexPosition: [
                -1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                1.0, 1.0, 0.0,
                -1.0, 1.0, 0.0
            ],
            aTextureCoord: [
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ]
        },
    });
    let data = drawCommands.createBuffer(new Float32Array([
        -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
        -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 0.0,
        -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 0.0
    ]));
    return ({inputcorrection, lens, refcoords, perspective, resolution, texture }) => {

        // transform an x-pixel coordinate to world coordinates (-1, 1)
        let transx = (x) => {
            return (x / resolution.x - 0.5) * 2
        }
        // transform an x-pixel coordinate to world coordinates (-1, 1)
        let transy = (y) => {
            return (y / resolution.y - 0.5) * 2
        }

        // the dots on the unmapped camera image that represent the corners of the bed
        let p0 = [transx(refcoords[0]), transy(refcoords[1])]
        let p1 = [transx(refcoords[2]), transy(refcoords[3])]
        let p2 = [transx(refcoords[4]), transy(refcoords[5])]
        let p3 = [transx(refcoords[6]), transy(refcoords[7])]
        
        let params={
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { uInputcorrection: inputcorrection.map(parseFloat),
                        p0: p0.map(parseFloat),
                        p1: p1.map(parseFloat),
                        p2: p2.map(parseFloat),
                        p3: p3.map(parseFloat),
                        uLens: lens.map(parseFloat),
                        perspective: perspective,
                        uSampler: texture },
            buffer: {
                data,
                stride: 20,
                offset: 0,
                count: 12,
            },
        };

        drawCommands.execute(params);
    };
}