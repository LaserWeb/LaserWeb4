import { DrawCommands } from '../draw-commands'

let gl, drawCommands, resolutionId, videoTexture;


export default function webcamFxProcess({canvas, video, settings})
{
    const params= settings.toolVideoFX

    if (!drawCommands){
        gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, preserveDrawingBuffer: true });
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1, 1, 1, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        drawCommands = new DrawCommands(gl);
        videoTexture = drawCommands.createTexture(canvas.width, canvas.height)
    } 
    if (drawCommands) {
        gl.viewport(0, 0, canvas.width, canvas.height);
       
        videoTexture.set({ image: video, width: canvas.width, height: canvas.height });

    
        let uniforms={  texture: videoTexture, 
                        inputcorrection: [params.inputcorrection.angle,
                                            params.inputcorrection.aspect,
                                            params.inputcorrection.scale ],
                        lens: [params.lens.invF, params.lens.r1, params.lens.r2],
                        perspective: true,
                        refcoords: [0, 0,
                                    0, canvas.height, 
                                    canvas.width, canvas.height,
                                    canvas.width, 0],
                                    /*params.refcoords,*/
                        resolution: {x: canvas.width, y: canvas.height} 
                    }

        drawCommands.webcamFX(uniforms)
    }
         
    return ()=>{
        if (drawCommands) drawCommands.destroy();
        gl=null; drawCommands=null; resolutionId=null; videoTexture=null;
    };
}

export function fxChain(drawCommands, fx, viewport=false) {
    let fxTexture;
    fx.forEach((params) => {
        let cb = () => {
            let uniforms = Object.assign({ texture: fxTexture }, params.uniforms);
            drawCommands[params.name](uniforms)
            fxTexture = (params.buffer) ? params.buffer.texture : null;
        }

        if (params.buffer) {
            drawCommands.useFrameBuffer(params.buffer, cb, viewport)
        } else {
            cb()
        }
    })
    return fxTexture;

}