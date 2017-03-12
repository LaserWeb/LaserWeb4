import RasterToGcode from 'lw.raster-to-gcode';
import queue from 'queue'

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

    if (!ok) {
        done(false);
        return [];
    }

    let gcode=[];

    let QE = new queue();
        QE.concurrency = 1;
        QE.timeout = 3600 * 1000
        QE.chunk = 100 / docsWithImages.length

    // POSTPROCESS GCODE;
    const postProcessing = (gc) => {
        let g = '';
        let raster = gc.join('\r\n') + "\r\n\r\n";

        if (op.useBlower) {
            if (settings.machineBlowerGcodeOn) {
                g += `\r\n` + settings.machineBlowerGcodeOn + '; Enable Air assist\r\n';
            }
        }


        for (let pass = 0; pass < op.passes; ++pass) {
            g += '\n\n; Pass ' + pass + '\r\n';
            if (settings.machineZEnabled) {
                let zHeight = Number(op.startHeight) + settings.machineZToolOffset - (op.passDepth * pass);
                g += `\r\n; Pass Z Height ${zHeight}mm (Offset: ${settings.machineZToolOffset}mm)\r\n`;
                g += 'G0 Z' + zHeight.toFixed(settings.decimal || 3) + '\r\n';
            }
            g += raster;
        }


        if (op.useBlower) {
            if (settings.machineBlowerGcodeOff) {
                g += `\r\n` + settings.machineBlowerGcodeOff + '; Disable Air assist\r\n';
            }
        }

        return g;
    }

    // FRAGMENT PROGRESS
    const percentProcessing = (percent) => {
        let p = parseInt((jobIndex * QE_chunk) + (percent * (QE_chunk / 100)))
        progress(p);
    }


    for (let index = 0; index < docsWithImages.length; index++) {

        QE.push((cb) => {

            const doc = docsWithImages[index]

            let params = {
                ppi: { x: doc.dpi / doc.scale[0], y: doc.dpi / doc.scale[1] },
                toolDiameter: op.laserDiameter,
                beamRange: { min: 0, max: settings.gcodeSMaxValue },
                beamPower: op.laserPowerRange, //Go go power rangeR!
                feedRate: op.cutRate * (settings.toolFeedUnits === 'mm/s' ? 60 : 1),
                offsets: { X: doc.translate[0], Y: doc.translate[1] },
                trimLine: op.trimLine,
                joinPixel: op.joinPixel,
                burnWhite: op.burnWhite,
                verboseG: op.verboseGcode,
                diagonal: op.diagonal,
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
                }
            }
            let r2g = new RasterToGcode(params)
            r2g.load(doc.image).then((rtg) => {
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

    }

    QE.start((err)=>{
        done(gcode.join("\r\n"));
    })


}