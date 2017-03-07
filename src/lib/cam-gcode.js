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

import { getLaserRasterGcodeFromOp } from './cam-gcode-raster'
import { rawPathsToClipperPaths, union, xor } from './mesh';

import queue from 'queue';

export function getGcode(settings, documents, operations, documentCacheHolder, showAlert, done, progress) {
    "use strict";

    const QE = new queue();
          QE.timeout = 3600 * 1000;
          QE.concurrency = 1;

    const gcode = [];
    const workers = [];
    let jobIndex=0;

    for (let opIndex = 0; opIndex < operations.length; ++opIndex) {
        let op = operations[opIndex];

        let geometry = [];
        let openGeometry = [];
        let tabGeometry = [];
        let docsWithImages = [];

        const jobDone = (g, cb) => { if (g !== false) { gcode.push(g); cb(); } }

        const invokeWebWorker = (ww, props, cb, jobIndex) => {
            console.log("starting job "+jobIndex)
            let peasant = new ww();
            peasant.onmessage = (e) => {
                let data = JSON.parse(e.data)
                if (data.event == 'onDone') {
                    console.log("job done "+jobIndex)
                    jobDone(data.gcode, cb)
                } else if (data.event == 'onProgress') {
                    let p = parseInt((jobIndex * QE.chunk) + (data.progress * QE.chunk / 100))
                    progress(p)
                } else {
                    data.errors.forEach((item) => {
                        showAlert(item.message, item.level)
                    })
                    QE.end()
                }
            }
            workers.push(peasant)
            peasant.postMessage(props)

        }

        QE.push((cb) => {
            let preflightWorker = require('worker-loader!./workers/cam-preflight.js');
            let preflight = new preflightWorker()
            preflight.onmessage = (e) => {
                let data = e.data;
                if (data.event == 'onDone') {
                    geometry = data.geometry
                    openGeometry = data.openGeometry
                    tabGeometry = data.tabGeometry
                    data.docsWithImages.forEach(_doc => {
                        let cache = documentCacheHolder.cache.get(_doc.id);
                        if (cache && cache.imageLoaded)
                            docsWithImages.push(Object.assign([], _doc, { image: cache.image }));
                    })
                    cb();
                } else if (data.event == 'onProgress') {
                    progress((data.percent / 100) * QE.chunk )
                } else if (data.event == 'onError'){
                    showAlert(data.message,data.level)
                    QE.end()
                }
                
            }
            workers.push(preflight)
            console.log("Preflight")
            preflight.postMessage({ settings, documents, opIndex, op, geometry, openGeometry, tabGeometry })

        })

        if (op.type === 'Laser Cut' || op.type === 'Laser Cut Inside' || op.type === 'Laser Cut Outside' || op.type === 'Laser Fill Path') {

            QE.push((cb) => {
                console.log(op.type)
                invokeWebWorker(require('worker-loader!./workers/cam-lasercut.js'), { settings, opIndex, op, geometry, openGeometry, tabGeometry }, cb, jobIndex)
            })

        } else if (op.type === 'Laser Raster') {

            QE.push((cb) => {
                console.log(op.type)
                getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, jobDone, progress, QE, workers);
                cb();
            })

        } else if (op.type.substring(0, 5) === 'Mill ') {
            console.log(op.type)
            QE.push((cb) => {
                invokeWebWorker(require('worker-loader!./workers/cam-mill.js'), { settings, opIndex, op, geometry, openGeometry, tabGeometry }, cb, jobIndex)
            })

        }
    } // opIndex

    QE.total = QE.length
    QE.chunk = 100 / QE.total

    
    progress(0)
    QE.on('success', (result, job) => {
        jobIndex++
        let p = parseInt(jobIndex * QE.chunk)
        progress(p);
    })
    QE.on('end', () => {
        workers.forEach((ww) => {
            if (ww.abort) {
                ww.abort()
            } else {
                ww.terminate();
            } 
        })
        
    })

    QE.start((err) => {
        progress(100)
        done(settings.gcodeStart + gcode.join('\r\n') + settings.gcodeEnd);
    })



    return QE;

} // getGcode


