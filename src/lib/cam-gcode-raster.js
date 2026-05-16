import { drawDocument } from '../components/workspace'
import { DrawCommands } from '../draw-commands'
import { DOCUMENT_INITIALSTATE } from '../reducers/document'
import RasterToGcode from './lw.raster2gcode/raster-to-gcode';
import queue from 'queue'
import { promisedImage } from '../components/image-filters.js';
import { getGenerator } from "./action2gcode/gcode-generator"

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

    let axisAFactor = (op.useA && op.aAxisDiameter) ? Number( 360 / op.aAxisDiameter / Math.PI).toFixed(3) : 1;

    let QE = new queue();
    QE.concurrency = 1;
    QE.timeout = 3600 * 1000
    QE.chunk = 100 / docsWithImages.length

    var generator=getGenerator(settings.gcodeGenerator,settings)

    // POSTPROCESS GCODE;
    const postProcessing = (gc) => {

        let g = '';
        let raster = '';

        let firstMove = gc.find((line)=>{
            return line.match(/^G[0-1]\s+[XYZA]/gi);
        })

        for (let line of gc) {
            if (op.useA) {
                line = line.replace(/Y(\s*-?[0-9\.]{1,})/gi, (str,float)=>{
                    return "A"+(parseFloat(float)*axisAFactor).toFixed(3)
                });

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
                    g += settings.machineBlowerGcodeOn + '; Enable Air assist\r\n';
                }
            }

            if (firstMove) {
                g+= `\r\n; First Move\r\n`;
                if (op.useA) {
                  g+= firstMove.replace(/^G[0-1]/gi,'G0').replace(/S[0\.]+/gi,'').replace(/Y(\s*-?[0-9\.]{1,})/gi, (str,float)=>{
                      return "A"+(parseFloat(float)*axisAFactor).toFixed(3)
                  }) + '\r\n';
                } else {
                  g+= firstMove.replace(/^G[0-1]/gi,'G0').replace(/S[0\.]+/gi,'') + '\r\n';
                }
            }

            if (settings.machineZEnabled) {
                let zHeight = Number(op.startHeight) + settings.machineZToolOffset - (op.passDepth * pass);
                g += `\r\n; Pass Z Height ${zHeight}mm (Offset: ${settings.machineZToolOffset}mm)\r\n`;
                g += 'G0 Z' + zHeight.toFixed(settings.decimal || 3) + '\r\n';
            }

            if (settings.gcodeToolOn && settings.gcodeToolOn.length){
                if(settings.gcodeToolOn.indexOf("$INTENSITY") > -1){
                    g += `${settings.gcodeToolOn.split("$INTENSITY").join(settings.gcodeLaserIntensity+settings.gcodeSMaxValue.toFixed(4))}\r\n`;
                }else{
                    g += `${settings.gcodeToolOn} \r\n`;
                }
                //g += `${settings.gcodeToolOn} \r\n`;
            }

            g += generator.postProcessRaster(raster); //g += (raster.replace(/G1/gi,'\nM5;\nM3;\nG1').replace(/G0/gi,'M5;\nG0')); TOOL ON OFF?

            if (settings.gcodeToolOff && settings.gcodeToolOff.length)
                g += `${settings.gcodeToolOff} \r\n`;

            if (op.useBlower) {
                if (settings.machineBlowerGcodeOff) {
                    g += settings.machineBlowerGcodeOff + '; Disable Air assist\r\n';
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
            promisedImage(doc.dataURL).then((img) => {


                if (op.useA && op.aAxisDiameter && op.diagonal) feedRate = feedRate/Math.SQRT2

                let scale = (settings.dpiBitmap * 100) / 2540;
                let docBounds = getImageBounds(doc.transform2d, img.width, img.height);
                let imgBounds= getImageBounds(doc.transform2d, img.width*scale, img.height*scale);

                // Canvas elements only support integer height/width sizes
                // If there's at least half a pixel to render, include it in the canvas
                let w = Math.round(imgBounds.x2-imgBounds.x1)
                let h = Math.round(imgBounds.y2-imgBounds.y1)

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
                    ppi: { x: settings.dpiBitmap, y: settings.dpiBitmap},
                    toolDiameter: op.laserDiameter,
                    beamRange: { min: 0, max: settings.gcodeSMaxValue },
                    beamPower: { min: op.laserPowerMin, max: op.laserPowerMax },
                    beamCutoff: op.laserPowerCutoff,
                    rapidRate: false,
                    feedRate,
                    offsets: {
                        X: (docBounds.x1 + docBounds.x2 - w / settings.dpiBitmap * 25.4) / 2 + doc.transform2d[4],
                        Y: (docBounds.y1 + docBounds.y2 - h / settings.dpiBitmap * 25.4) / 2 + doc.transform2d[5],
                    },
                    trimLine: op.trimLine,
                    joinPixel: op.joinPixel,
                    burnWhite: op.burnWhite,
                    laserHasIntensity: settings.machineLaserHasIntensity,
                    verboseG: op.verboseGcode,
                    vertical: op.vertical,
                    diagonal: op.diagonal,
                    overscan: op.overScan,
                    gcodeGenerator : settings.gcodeGenerator,
                    gcodeToolOn : settings.gcodeToolOn,
                    gcodeToolOff : settings.gcodeToolOff,
                    gcodeLaserIntensity: settings.gcodeLaserIntensity,
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

                        let rasterWorker = require('./workers/cam-raster.worker.js')
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

export function getLaserRasterMergeGcodeFromOp(settings, documentCacheHolder, opIndex, op, filteredDocIds, showAlert, done, progress, jobIndex, QE_chunk, workers) {
    let bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
    let filteredCachedDocs = [];
    for (let cache of documentCacheHolder.cache.values()) {
        let doc = cache.document;
        if (filteredDocIds.has(doc.id) && doc.transform2d && cache.bounds) {
            filteredCachedDocs.push(cache);
            bounds.x1 = Math.min(bounds.x1, cache.bounds.x1 + doc.transform2d[4]);
            bounds.y1 = Math.min(bounds.y1, cache.bounds.y1 + doc.transform2d[5]);
            bounds.x2 = Math.max(bounds.x2, cache.bounds.x2 + doc.transform2d[4]);
            bounds.y2 = Math.max(bounds.y2, cache.bounds.y2 + doc.transform2d[5]);
        }
    }
    if (filteredCachedDocs.length) {
        bounds.x2 = Math.max(bounds.x2, bounds.x1 + 1);
        bounds.y2 = Math.max(bounds.y2, bounds.y1 + 1);
        let width = Math.ceil((bounds.x2 - bounds.x1) / op.laserDiameter);
        let height = Math.ceil((bounds.y2 - bounds.y1) / op.laserDiameter);
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, preserveDrawingBuffer: true });
        let drawCommands = new DrawCommands(gl);
        let perspective = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        let sx = 2 / (bounds.x2 - bounds.x1);
        let sy = 2 / (bounds.y2 - bounds.y1);
        let tx = -1 - sx * bounds.x1;
        let ty = -1 - sy * bounds.y1;
        let view = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1];
        gl.viewport(0, 0, width, height);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        for (let cachedDocument of filteredCachedDocs)
            drawDocument(perspective, view, drawCommands, cachedDocument, true);
        let docsWithImages = [{
            ...DOCUMENT_INITIALSTATE,
            transform2d: [(bounds.x2 - bounds.x1) / width, 0, 0, (bounds.y2 - bounds.y1) / height, bounds.x1, bounds.y1],
            dataURL: canvas.toDataURL(),
        }];
        drawCommands.destroy();

        getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, jobIndex, QE_chunk, workers);
    } else
        done('');
}
