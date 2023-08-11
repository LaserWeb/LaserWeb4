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

import { getLaserRasterGcodeFromOp, getLaserRasterMergeGcodeFromOp } from './cam-gcode-raster'
import { rawPathsToClipperPaths, union, xor } from './mesh';

import { GlobalStore } from '../index'

import queue from 'queue';

import hhmmss from 'hhmmss';

export const expandHookGCode = (operation) =>{
    let state = GlobalStore().getState(); 
    let macros = state.settings.macros || {};
    let op=Object.assign({},operation)
    let hooks = Object.keys(op).filter(i=>i.match(/^hook/gi))
        hooks.forEach(hook => {
            let keys = op[hook].split(',')
            let gcode='';
            if (keys.length){
                keys.forEach(key=>{
                    if (macros[key]) gcode+=("\r\n; Macro ["+hook+"]: "+macros[key].label+"\r\n"+macros[key].gcode+"\r\n")
                })
            }
            op[hook] = gcode;
        })

    return op;
}

export function getGcode(settings, documents, operations, documentCacheHolder, showAlert, done, progress) {
    "use strict";

    let starttime=new Date().getTime()

    const QE = new queue();
    QE.timeout = 3600 * 1000;
    QE.concurrency = settings.gcodeConcurrency || 1;

    const gcode = Array(operations.length);
    const gauge = Array(operations.length*2).fill(0)
    const workers = [];
    let jobIndex = 0;

    for (let opIndex = 0; opIndex < operations.length; ++opIndex) {
        let op = expandHookGCode(operations[opIndex]);

        const jobDone = (g, cb) => { 
            if (g !== false) { gcode[opIndex]=g; };  cb();
        }

        let invokeWebWorker = (ww, props, cb, jobIndex) => {
            let peasant = new ww();
            peasant.onmessage = (e) => {
                let data = JSON.parse(e.data)
                if (data.event == 'onDone') {
                    gauge[props.opIndex*2+1]=100;
                    progress(gauge)
                    jobDone(data.gcode, cb)
                } else if (data.event == 'onProgress') {
                    gauge[props.opIndex*2+1]=data.progress;
                    progress(gauge)
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

        let preflightPromise = (settings, documents, opIndex, op, workers) => {
            return new Promise((resolve, reject) => {
                let geometry = [];
                let openGeometry = [];
                let tabGeometry = [];
                let filteredDocIds = [];
                let docsWithImages = [];

                let preflightWorker = require('worker-loader!./workers/cam-preflight.js');
                let preflight = new preflightWorker()
                preflight.onmessage = (e) => {
                    let data = e.data;
                    if (data.event == 'onDone') {
                        if (data.geometry) geometry = data.geometry
                        if (data.openGeometry) openGeometry = data.openGeometry
                        if (data.tabGeometry) tabGeometry = data.tabGeometry
                        if (data.filteredDocIds) filteredDocIds = data.filteredDocIds
                        data.docsWithImages.forEach(_doc => {
                            let cache = documentCacheHolder.cache.get(_doc.id);
                            if (cache && cache.imageLoaded)
                                docsWithImages.push(Object.assign([], _doc, { image: cache.image }));
                        })
                        gauge[opIndex*2]=100;
                        resolve({ geometry, openGeometry, tabGeometry, filteredDocIds, docsWithImages })
                    } else if (data.event == 'onProgress') {
                        gauge[opIndex*2]=data.percent;
                        progress(gauge)
                    } else if (data.event == 'onError') {
                        reject(data)
                    }

                }
                workers.push(preflight)
                preflight.postMessage({ settings, documents, opIndex, op, geometry, openGeometry, tabGeometry })
            })
        }

        if (op.enabled) QE.push((cb) => {
            console.log(op.type + "->" + jobIndex)
            preflightPromise(settings, documents, opIndex, op, workers)
                .then((preflight) => {
                    let { geometry, openGeometry, tabGeometry, filteredDocIds, docsWithImages } = preflight;

                    if (op.type === 'Laser Cut' || op.type === 'Laser Cut Inside' || op.type === 'Laser Cut Outside' || op.type === 'Laser Fill Path') {

                        invokeWebWorker(require('worker-loader!./workers/cam-lasercut.js'), { settings, opIndex, op, geometry, openGeometry, tabGeometry }, cb, jobIndex)

                    } else if (op.type === 'Laser Raster') {

                        getLaserRasterGcodeFromOp(settings, opIndex, op, docsWithImages, showAlert, (gcode)=>{jobDone(gcode,cb)}, progress, jobIndex, QE.chunk, workers);

                    } else if (op.type === 'Laser Raster Merge') {

                        getLaserRasterMergeGcodeFromOp(settings, documentCacheHolder, opIndex, op, filteredDocIds, showAlert, (gcode) => { jobDone(gcode, cb) }, progress, jobIndex, QE.chunk, workers);

                    } else if (op.type.substring(0, 5) === 'Mill ') {

                        invokeWebWorker(require('worker-loader!./workers/cam-mill.js'), { settings, opIndex, op, geometry, openGeometry, tabGeometry }, cb, jobIndex)

                    } else if (op.type.substring(0, 6) === 'Lathe ') {

                        invokeWebWorker(require('worker-loader!./workers/cam-lathe.js'), { settings, opIndex, op, geometry, openGeometry, tabGeometry }, cb, jobIndex)

                    } else {
                        showAlert("Unknown operation " + op.type, 'warning')
                        cb()
                    }
                })
                .catch((err) => {
                    showAlert(err.message, err.level)
                    QE.end()
                })
        })

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
            ww.terminate();
        })

    })

    QE.start((err) => {
        progress(100)
        let elapsed=(new Date().getTime()-starttime)/1000;
        showAlert("Elapsed: "+hhmmss(elapsed)+String(Number(elapsed-Math.floor(elapsed)).toFixed(3)).substr(1),"info");
        done(settings.gcodeStart + gcode.join('\r\n') + settings.gcodeEnd);
    })



    return QE;

} // getGcode


