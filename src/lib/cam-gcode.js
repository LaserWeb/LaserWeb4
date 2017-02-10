// Copyright 2014, 2016 Todd Fleming
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

'use strict';

import RasterToGcode from 'lw.raster-to-gcode';

import { getLaserCutGcodeFromOp } from './cam-gcode-laser-cut'
import { getMillGcodeFromOp } from './cam-gcode-mill'
import { rawPathsToClipperPaths, union, xor } from './mesh';

import queue from 'queue';

function matchColor(filterColor, color) {
    if (!filterColor)
        return true;
    if (!color)
        return false;
    return filterColor[0] == color[0] && filterColor[1] == color[1] && filterColor[2] == color[2] && filterColor[3] == color[3];
}

export function getGcode(settings, documents, operations, documentCacheHolder, showAlert, done, progress) {
    "use strict";

    const QE = new queue();
    QE.timeout = 3600 * 1000;
    QE.concurrency = 1;

    const gcode = [];

    for (let opIndex = 0; opIndex < operations.length; ++opIndex) {
        let op = operations[opIndex];

        let geometry = [];
        let openGeometry = [];
        let tabGeometry = [];
        let docsWithImages = [];
        function examineDocTree(isTab, id) {
            let doc = documents.find(d => d.id === id);
            if (doc.rawPaths) {
                if (isTab) {
                    tabGeometry = union(tabGeometry, rawPathsToClipperPaths(doc.rawPaths, doc.scale[0], doc.scale[1], doc.translate[0], doc.translate[1]));
                } else if (matchColor(op.filterFillColor, doc.fillColor) && matchColor(op.filterStrokeColor, doc.strokeColor)) {
                    let isClosed = false;
                    for (let rawPath of doc.rawPaths)
                        if (rawPath.length >= 4 && rawPath[0] == rawPath[rawPath.length - 2] && rawPath[1] == rawPath[rawPath.length - 1])
                            isClosed = true;
                    let clipperPaths = rawPathsToClipperPaths(doc.rawPaths, doc.scale[0], doc.scale[1], doc.translate[0], doc.translate[1]);
                    if (isClosed)
                        geometry = xor(geometry, clipperPaths);
                    else if (!op.filterFillColor)
                        openGeometry = openGeometry.concat(clipperPaths);
                }
            }
            if (doc.type === 'image' && !isTab) {
                let cache = documentCacheHolder.cache.get(doc.id);
                if (cache && cache.imageLoaded)
                    docsWithImages.push(Object.assign([], doc, { image: cache.image }));
            }
            for (let child of doc.children)
                examineDocTree(isTab, child);
        }
        for (let id of op.documents)
            examineDocTree(false, id);
        for (let id of op.tabDocuments)
            examineDocTree(true, id);

        if (op.type === 'Laser Cut' || op.type === 'Laser Cut Inside' || op.type === 'Laser Cut Outside' || op.type === 'Laser Fill Path') {

            QE.push((cb) => {
                let g = getLaserCutGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert);
                if (g) gcode.push(g);
                cb()
            })

        } else if (op.type === 'Laser Raster') {

            let pingpong = (g, cb) => { if (g !== false) gcode.push(g); cb(); }
            getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, pingpong, progress, QE);

        } else if (op.type.substring(0, 5) === 'Mill ') {

            QE.push((cb) => {
                let g = getMillGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert);
                if (g) gcode.push(g);
                cb()
            })

        }
    } // opIndex

    QE.total= QE.length
    QE.chunk= 100 / QE.total
    
    progress(0)
    QE.on('success', (result, job) => {
        let jobIndex = gcode.length;
        let p=parseInt(jobIndex * QE.chunk)
        progress(p);
    })

    QE.start((err) => {
        progress(100)
        done(settings.gcodeStart + gcode.join('\r\n') + settings.gcodeEnd);
    })

} // getGcode

function getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, done, progress, QE) {

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
