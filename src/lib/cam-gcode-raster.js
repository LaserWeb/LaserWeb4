import RasterToGcode from './lw.raster2gcode/raster-to-gcode';
import queue from 'queue'


const getImageBounds=(t,w,h)=>{
    let tx = (x, y) => t[0] * x + t[2] * y;
    let ty = (x, y) => t[1] * x + t[3] * y;
    return {
        x1: Math.min(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
        y1: Math.min(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h)),
        x2: Math.max(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
        y2: Math.max(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h)),
    };
}

const promisedImage = (path) => {
    return new Promise(resolve => {
        let img = new Image();
        img.onload = () => { resolve(img) }
        img.src = path;
    })
}

export function getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, jobIndex, QE_chunk, workers) {

    let ok = true;

    if (!(op.laserDiameter > 0)) {
        showAlert("LaserDiameter should be greater than 0", "danger");
        ok = false;
    }

    if (!(op.cutRate > 0)) {
        showAlert("CutRate should be greater than 0", "danger");
        ok = false;
    }

    if (settings.machineZEnabled) {
        if (op.startHeight === "" || isNaN(op.startHeight)) {
            showAlert("Start Height must be a valid number", "danger");
            ok = false;
        }
    }

    if (op.useA && !op.aAxisDiameter) {
        showAlert("Axis Diameter must be > 0", "danger");
        ok = false;
    }

    if (!ok) {
        done(false);
        return [];
    }

    let gcode = [];

    let QE = new queue();
    QE.concurrency = 1;
    QE.timeout = 3600 * 1000
    QE.chunk = 100 / docsWithImages.length

    // POSTPROCESS GCODE;
    const postProcessing = (gc) => {
        let g = '';
        let raster = '';
        for (let line of gc) {
            if (op.useA) {
                line = line.replace(/Y(\s*[0-9\.]{1,})/gi, "A$1");
            }
            if (line[0] !== 'S' && line.substring(0, 4) !== 'G0 F') {
                raster += line + '\r\n';
            } else {
                raster += '; stripped: ' + line + '\r\n';
            }
        }

        raster += '\r\n\r\n';

        if (op.hookOperationStart.length) g += op.hookOperationStart;

        for (let pass = 0; pass < op.passes; ++pass) {
            g += '\n\n; Pass ' + pass + '\r\n';

            if (op.hookPassStart.length) g += op.hookPassStart;

            if (op.useBlower) {
                if (settings.machineBlowerGcodeOn) {
                    g += `\r\n` + settings.machineBlowerGcodeOn + '; Enable Air assist\r\n';
                }
            }

            if (settings.machineZEnabled) {
                let zHeight = Number(op.startHeight) + settings.machineZToolOffset - (op.passDepth * pass);
                g += `\r\n; Pass Z Height ${zHeight}mm (Offset: ${settings.machineZToolOffset}mm)\r\n`;
                g += 'G0 Z' + zHeight.toFixed(settings.decimal || 3) + '\r\n';
            }

            if (settings.gcodeToolOn && settings.gcodeToolOn.length)
                g += `${settings.gcodeToolOn} \r\n`;

            g += raster;

            if (settings.gcodeToolOff && settings.gcodeToolOff.length)
                g += `${settings.gcodeToolOff} \r\n`;

            if (op.useBlower) {
                if (settings.machineBlowerGcodeOff) {
                    g += `\r\n` + settings.machineBlowerGcodeOff + '; Disable Air assist\r\n';
                }
            }

            if (op.hookPassEnd.length) g += op.hookPassEnd;
        }

        if (op.hookOperationEnd.length) g += op.hookOperationEnd;

        return g;
    }

    // FRAGMENT PROGRESS
    const percentProcessing = (percent) => {
        let p = parseInt((jobIndex * QE_chunk) + (percent * (QE_chunk / 100)))
        progress(p);
    }


    for (let index = 0; index < docsWithImages.length; index++) {

        QE.push((cb) => {

            const doc = Object.assign({}, docsWithImages[index])
            let feedRate = op.cutRate * (settings.toolFeedUnits === 'mm/s' ? 60 : 1);
            let axisAFactor = 1
            promisedImage(doc.dataURL).then((img) => {

                
                if (op.useA && op.aAxisDiameter){
                    axisAFactor=Number( 360 / op.aAxisDiameter / Math.PI).toFixed(3)
                    if (op.diagonal) feedRate = feedRate/Math.SQRT2
                }
               
                let scale = 1/(25.4/settings.dpiBitmap)
                let docBounds = getImageBounds(doc.transform2d, img.width, img.height);
                let imgBounds= getImageBounds(doc.transform2d, img.width*scale, img.height*scale);

                let w = imgBounds.x2-imgBounds.x1
                let h = imgBounds.y2-imgBounds.y1

                let canvas = document.createElement('canvas')
                    canvas.width = w
                    canvas.height = h

                let ctx = canvas.getContext('2d')
                    /* Centering Transform */
                    ctx.translate(w/2,h/2) 
                    /* WCS correction */
                    ctx.transform( -doc.transform2d[0]*scale, doc.transform2d[1]*scale, 
                                    doc.transform2d[2]*scale, -doc.transform2d[3]*scale,
                                    0, 0)
                    ctx.rotate((Math.PI / 180) * 180)
                    /* /WCS correction */
                    /* De-Centering Transform */
                    ctx.translate(-w/2,-h/2)
                    /* Centering Image*/
                    ctx.translate((w-img.width)/2,(h-img.height)/2)
                    ctx.drawImage(img, 0, 0)
                    ctx.save();


                let params = {
                    ppi: { x: settings.dpiBitmap, y: settings.dpiBitmap / axisAFactor },
                    toolDiameter: op.laserDiameter,
                    beamRange: { min: 0, max: settings.gcodeSMaxValue },
                    beamPower: op.laserPowerRange, //Go go power rangeR!
                    rapidRate: false,
                    feedRate,
                    offsets: { 
                        X: (docBounds.x1 + docBounds.x2 - w / settings.dpiBitmap * 25.4) / 2 + doc.transform2d[4],
                        Y: ((docBounds.y1 + docBounds.y2 - h / settings.dpiBitmap * 25.4) / 2 + doc.transform2d[5]) * axisAFactor,
                    },
                    trimLine: op.trimLine,
                    joinPixel: op.joinPixel,
                    burnWhite: op.burnWhite,
                    verboseG: op.verboseGcode,
                    diagonal: op.diagonal,
                    overscan: op.overScan,
                    nonBlocking: false,
                    milling: false,
                    filters: {
                        smoothing: op.smoothing,
                        brightness: op.brightness,
                        contrast: op.contrast,
                        gamma: op.gamma,
                        grayscale: op.grayscale,
                        shadesOfGray: op.shadesOfGray,
                        invertColor: op.invertColor,
                        dithering: op.dithering
                    }
                }
                let r2g = new RasterToGcode(params)
                    r2g.load(canvas.toDataURL()).then((rtg) => {
                        let properties = {
                            cellSize: rtg.cellSize,
                            scaleRatio: rtg.scaleRatio,
                            filters: rtg.filters,
                            size: rtg.size,
                            pixels: rtg.pixels
                        }

                        let rasterWorker = require('worker-loader!./workers/cam-raster.js')
                        let r2g = new rasterWorker();
                        r2g.onmessage = function (event) {
                            if (event.data.event === 'onDone') {
                                gcode.push(postProcessing(event.data.gcode)); cb();
                            } else if (event.data.event === 'onProgress') {
                                percentProcessing((index * QE.chunk) + (event.data.percent * QE.chunk / 100))
                            }
                        };

                        workers.push(r2g)
                        r2g.postMessage({ cmd: 'start', settings: params, properties });

                    })
            })
                
        })

    }

    QE.start((err) => {
        done(gcode.join("\r\n"));
    })


}