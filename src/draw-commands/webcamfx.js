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


export function barrelDistort(drawCommands) {
    let program = drawCommands.compile({
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
                return glCoord  * vec2(1.0, 1.0)/ 2.0 + vec2(0.5, 0.5);
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
    return ({lens, fov, texture }) => {
        drawCommands.execute({
            program,
            primitive: drawCommands.gl.TRIANGLES,
            uniforms: { uLens: lens.map(parseFloat), uFov: fov.map(parseFloat), uSampler: texture },
            buffer: {
                data,
                stride: 20,
                offset: 0,
                count: 12,
            },
        });
    };
}
