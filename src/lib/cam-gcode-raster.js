import RasterToGcode from 'lw.raster-to-gcode';

export function getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, QE) {

    let ok = true;

    if (!(op.laserDiameter > 0)) {
        showAlert("LaserDiameter should be greater than 0");
        ok = false;
    }

    if (!(op.cutRate > 0)) {
        showAlert("CutRate should be greater than 0");
        ok = false;
    }

    if (!ok)
        done(false);

    
    const percentProcessing = (ev) => {
            let jobIndex=QE.total - QE.length
            let p=parseInt((jobIndex * QE.chunk) + (ev.percent*QE.chunk/100))
            progress(p);
    }

    for (let index = 0; index < docsWithImages.length; index++) {

        QE.push((cb) => {

            const doc = docsWithImages[index]
            const doneProcessing = (ev) => {
                let g = '';
                let raster = ev.gcode.join('\r\n');

                if (op.useBlower) {
                    if (settings.machineBlowerGcodeOn) {
                        g += `\r\n` + settings.machineBlowerGcodeOn + '; Enable Air assist\r\n';
                    }
                }

                if (op.passes > 1) {
                    for (let pass = 0; pass < op.passes; ++pass) {
                        g += '\n\n; Pass ' + pass + '\r\n';
                        if (settings.machineZEnabled) {
                            let zHeight = op.startHeight + settings.machineZToolOffset - (op.passDepth * pass);
                            g += `\r\n; Pass Z Height ${zHeight}mm (Offset: ${settings.machineZToolOffset}mm)\r\n`;
                            g += 'G1 Z' + zHeight.toFixed(settings.decimal || 3) + '\r\n';
                        }
                        g += raster;
                    }
                } else {
                    g += raster;
                }

                if (op.useBlower) {
                    if (settings.machineBlowerGcodeOff) {
                        g += `\r\n` + settings.machineBlowerGcodeOff + '; Disable Air assist\r\n';
                    }
                }

                done(g, cb)
            }


            let r2g = new RasterToGcode({
                ppi: { x: doc.dpi / doc.scale[0], y: doc.dpi / doc.scale[1] },
                beamSize: op.laserDiameter,
                beamRange: { min: 0, max: settings.gcodeSMaxValue },
                beamPower: op.laserPowerRange, //Go go power rangeR!
                feedRate: op.cutRate * (settings.toolFeedUnits === 'mm/s' ? 60 : 1),
                offsets: { X: doc.translate[0], Y: doc.translate[1] },
                trimLine: op.trimLine,
                joinPixel: op.joinPixel,
                burnWhite: op.burnWhite,
                verboseG: op.verboseGcode,
                diagonal: op.diagonal,
                nonBlocking: true,
                filters: {
                    smoothing: op.smoothing,
                    brightness: op.brightness,
                    contrast: op.contrast,
                    gamma: op.gamma,
                    grayscale: op.grayscale,
                    shadesOfGray: op.shadesOfGray,
                    invertColor: op.invertColor,
                },
                progress: (ev) => { percentProcessing({ ...ev, doc, index }) },
                done: doneProcessing
            });
            r2g.loadFromImage(doc.image);
            r2g._processImage();

            r2g.run()   //doneProcessing at the end, my friend

        })

    }


}