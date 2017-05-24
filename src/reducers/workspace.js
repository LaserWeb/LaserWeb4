"use strict";

import { objectNoId } from '../reducers/object'

export const WORKSPACE_INITIALSTATE = {
    width: 1000,
    height: 1000,
    g0Rate: 1000,
    simTime: 1e10,
    cursorPos: [0, 0, 0],
    showGcode: true,
    showLaser: true,
    showDocuments: true,
    showCursor: true,
    showWebcam: false,
    workOffsetX: 0,
    workOffsetY: 0,
    initialZoom: false,
}

export const workspace = objectNoId('workspace', WORKSPACE_INITIALSTATE);
