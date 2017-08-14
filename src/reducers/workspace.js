"use strict";

import { objectNoId } from '../reducers/object'

export const WORKSPACE_INITIALSTATE = {
    width: 1000,
    height: 1000,
    g0Rate: 1000,
    rotaryDiameter: 10,
    simTime: 1e10,
    cursorPos: [0, 0, 0],
    showGcode: true,
    showLaser: true,
    showDocuments: true,
    showRotary: false,
    showCursor: true,
    showWebcam: false,
    showTracer: false,
    showRasterPreview: false,
    workOffsetX: 0,
    workOffsetY: 0,
    initialZoom: false,
    tracer: {dataURL: null, name: null},
}

export const workspace = (state, action) => {
    state = objectNoId('workspace', WORKSPACE_INITIALSTATE)(state, action);

    switch (action.type) {
        case "VIDEOCAPTURE_START_STREAM":
            if (state.tracer && state.tracer.dataURL.indexOf('stream:')>=0) 
                state=Object.assign({},state,{tracer:{alpha:state.tracer.alpha,dataURL:`stream:${action.payload}`, name:action.payload, timestamp: (new Date()).getTime()}})
        break;
    }
    return state;
}
