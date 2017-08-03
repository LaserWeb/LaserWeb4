import { DrawCommands } from '../draw-commands'



export default function webcamFxProcess({canvas, video, settings})
{
    

    const gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, preserveDrawingBuffer: true });
     
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(1, 1, 1, 1);
          gl.clearDepth(1);
          gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.BLEND);
    
          const drawCommands = new DrawCommands(gl);
    
        const videoTexture = drawCommands.createTexture(canvas.width, canvas.height);
              videoTexture.set({ image: video, width: canvas.width, height: canvas.height });

        const params= settings.toolVideoFX
            // APPLIES FX CHAIN
                let vt = fxChain(drawCommands,
                    [
                        {name: 'webcamFX',  buffer: null, uniforms: {  texture: videoTexture, 
                                                                            inputcorrection: [params.inputcorrection.angle,
                                                                                                params.inputcorrection.aspect,
                                                                                                params.inputcorrection.scale ],
                                                                            lens: [params.lens.invF, params.lens.r1, params.lens.r2],
                                                                            perspective: false,
                                                                            refcoords: params.refcoords/*[0, 0,
                                                                                        0, params.height, 
                                                                                        params.width, params.height,
                                                                                        params.width, 0]*/,
                                                                            resolution: {x: params.width, y: params.height} } }
                    ]
                )
     
    
        drawCommands.destroy()
         
    return canvas;
}

function fxChain(drawCommands, fx) {
    let fxTexture;
    fx.forEach((params) => {
        let cb = () => {
            let uniforms = Object.assign({ texture: fxTexture }, params.uniforms);
            drawCommands[params.name](uniforms)
            fxTexture = (params.buffer) ? params.buffer.texture : null;
        }

        if (params.buffer) {
            drawCommands.useFrameBuffer(params.buffer, cb)
        } else {
            cb()
        }
    })
    return fxTexture;

}