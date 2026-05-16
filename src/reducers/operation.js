"use strict";

import { getParentIds, object, objectArray } from '../reducers/object'

import {arrayMoveImmutable} from 'array-move'

import { GlobalStore } from '../index';

export const OPERATION_INITIALSTATE = {
    id: '',
    name: '',
    enabled: true,
    documents: [],
    tabDocuments: [],
    expanded: false,
    type: 'Laser Cut',
    filterFillColor: null,
    filterStrokeColor: null,
    direction: 'Conventional',
    laserPower: 100,
    laserPowerMin: 0,
    laserPowerMax: 100,
    laserPowerCutoff: 0,
    laserDiameter: 0,
    toolDiameter: 0,
    lineDistance: 0,
    lineAngle: 0,
    margin: 0,
    passes: 1,
    cutWidth: 0,
    toolSpeed: 0,
    stepOver: 40,
    passDepth: 0,
    startHeight: 0,
    millRapidZ: 0,
    millStartZ: 0,
    millEndZ: 0,
    segmentLength: 0,
    tabDepth: 0,
    plungeRate: 0,
    cutRate: 0,
    overScan: 0,
    toolAngle: 0,
    ramp: false,
    useA: false,
    aAxisDiameter: 0,
    useBlower: false,
    useFluid: false,
    smoothing: false,       // lw.raster-to-gcode: Smoothing the input image ?
    brightness: 0,          // lw.raster-to-gcode: Image brightness [-255 to +255]
    contrast: 0,            // lw.raster-to-gcode: Image contrast [-255 to +255]
    gamma: 0,               // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
    grayscale: 'none',      // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
    shadesOfGray: 256,      // lw.raster-to-gcode: Number of shades of gray [2-256]
    invertColor: false,     // lw.raster-to-gcode
    trimLine: true,         // lw.raster-to-gcode: Trim trailing white pixels
    joinPixel: true,        // lw.raster-to-gcode: Join consecutive pixels with same intensity
    burnWhite: true,        // lw.raster-to-gcode: [true = G1 S0 | false = G0] on inner white pixels
    verboseGcode: false,    // lw.raster-to-gcode: Output verbose GCode (print each commands)
    vertical: false,        // lw.raster-to-gcode: Go vertically / reverse diagonal
    diagonal: false,        // lw.raster-to-gcode: Go diagonally (increase the distance between points)
    dithering: false,       // lw.raster-to-gcode: Floyd Steinberg dithering
    latheToolBackSide: false,
    latheRapidToDiameter: 0,
    latheRapidToZ: 0,
    latheStartZ: 0,
    latheRoughingFeed: 0,
    latheRoughingDepth: 0,
    latheFinishFeed: 0,
    latheFinishDepth: 0,
    latheFinishExtraPasses: 0,
    latheFace: true,
    latheFaceEndDiameter: 0,
    latheTurns: [],
    _docs_visible: true,
    // Hooks!
    hookOperationStart: '',
    hookOperationEnd: '',
    hookPassStart: '',
    hookPassEnd: ''
};

const OPERATION_LATHE_TURN_INITIALSTATE = {
    id: '',
    startDiameter: 0,
    endDiameter: 0,
    length: 0,
};

const operationBase = object('operation', OPERATION_INITIALSTATE);
const operationLatheTurnBase = object('operation_lathe_turn', OPERATION_LATHE_TURN_INITIALSTATE);
const operationLatheTurnsBase = objectArray('operation_lathe_turn', operationLatheTurnBase);

export const OPERATION_DEFAULTS = (state) => {
    if (!state) state = GlobalStore().getState()
    return {
        laserDiameter: state.settings.machineBeamDiameter,
        lineDistance: state.settings.machineBeamDiameter,
        burnWhite: state.settings.machineBurnWhite,
        useBlower: state.settings.machineBlowerEnabled,
        useFluid: state.settings.machineFluidEnabled,
        millRapidZ: state.settings.machineRapidZ,
        startHeight: state.settings.machineZStartHeight,
        aAxisDiameter: state.settings.machineAAxisDiameter,
        segmentLength:  state.settings.gcodeSegmentLength,
    }
}

export function operation(state, action) {
    if (action.type !== 'LOADED')
        state = operationBase(state, action);
    switch (action.type) {
        case 'OPERATION_REMOVE_DOCUMENT':
            if (action.payload.id === state.id)
                if (action.payload.isTab)
                    return { ...state, tabDocuments: state.tabDocuments.filter(d => d !== action.payload.document) }
                else
                    return { ...state, documents: state.documents.filter(d => d !== action.payload.document) }
            break;
        case 'OPERATION_LATHE_TURN_ADD':
            if (action.payload.id === state.id)
                return { ...state, latheTurns: operationLatheTurnsBase(state.latheTurns, action) };
            break;
        case 'OPERATION_LATHE_TURN_SET_ATTRS':
        case 'OPERATION_LATHE_TURN_REMOVE':
        case 'LOADED':
            state = { ...state };
            if ('clearance' in state && !('millRapidZ' in state))
                state.millRapidZ = state.clearance;
            if ('cutDepth' in state && !('millEndZ' in state))
                state.millEndZ = -state.cutDepth;
            delete state.clearance;
            delete state.cutDepth;
            state = operationBase(state, action);
            return { ...state, latheTurns: operationLatheTurnsBase(state.latheTurns, action) };
    }
    return state;
}

export const operations = (state, action) => {
    state = objectArray('operation', operation)(state, action);
    switch (action.type) {
        case 'OPERATION_MOVE_CURRENT':
            let index = state.findIndex(item => item.id == action.payload.id)
            let newIndex = index + action.payload.step;
            if (newIndex < 0)
                newIndex = 0;
            if (newIndex > state.length - 1)
                newIndex = state.length - 1;
            return arrayMoveImmutable(state.slice(), index, newIndex);
        case 'OPERATION_SET_ATTRS':
            if (action.payload.attrs.expanded)
                state = state.map(op => ({ ...op, expanded: op.id === action.payload.id }));
            break;
        case 'OPERATION_ADD':
            state = state.map(op => ({ ...op, expanded: op.id === action.payload.attrs.id }));
            break;
        case "OPERATION_SPREAD_FIELD":
            let op = state.find(o => o.id === action.payload.id)
            if (op) state = state.map(o => {
                if (!o.enabled) return o;
                return { ...o, [action.payload.field]: op[action.payload.field] }
            })
            break;
        case 'WORKSPACE_RESET':
        case 'OPERATION_CLEAR_ALL':
            state = [];
    }
    return state;
}

export function currentOperation(state = '', action) {
    if (action.type === 'OPERATION_SET_CURRENT')
        return action.payload;
    else if (action.type === 'OPERATION_ADD')
        return action.payload.attrs.id;
    else if (action.type === 'OPERATION_SET_ATTRS' || action.type === 'OPERATION_ADD_DOCUMENTS')
        return action.payload.id;
    else if (action.type === 'WORKSPACE_RESET')
        return '';
    else
        return state;
}

export function operationsAddDocuments(state, documents, action) {
    return state.map(operation => {
        if (operation.id !== action.payload.id)
            return operation;
        let combined;
        if (action.payload.isTab)
            combined = [...operation.tabDocuments];
        else
            combined = [...operation.documents];
        for (let id of action.payload.documents)
            if (!combined.includes(id))
                combined.push(id);
        let result = [];
        for (let id of combined) {
            let ok = true;
            let parents = getParentIds(documents, id);
            for (let i = 1; i < parents.length; ++i)
                if (combined.includes(parents[i]))
                    ok = false;
            if (ok)
                result.push(id);
        }
        if (action.payload.isTab)
            return Object.assign({}, operation, { tabDocuments: result });
        else
            return Object.assign({}, operation, { documents: result });
    });
}

export function fixupOperations(state, documents) {
    return state.map(
        operation => Object.assign(
            {},
            operation,
            {
                documents: operation.documents.filter(
                    id => documents.find(d => d.id === id))
            }));
}
