"use strict";

import { getParentIds, object, objectArray } from '../reducers/object'

import arrayMove from 'array-move'

import { GlobalStore } from '../index';

const operationBase = object('operation', {
    id: '',
    name: '',
    documents: [],
    tabDocuments: [],
    expanded: false,
    type: 'Laser Cut',
    filterFillColor: null,
    filterStrokeColor: null,
    direction: 'Conventional',
    laserPower: 100,
    laserPowerRange: {min:0, max:100},
    laserDiameter: 0,
    toolDiameter: 0,
    lineDistance: 0,
    lineAngle: 0,
    margin: 0,
    passes: 1,
    cutWidth: 0,
    stepOver: 0.4,
    passDepth: 0,
    startHeight: '',
    cutDepth: 0,
    segmentLength: 0,
    tabDepth: 0,
    clearance: 0,
    plungeRate: 0,
    cutRate: 0,
    toolAngle: 0,
    useA: false,
    aAxisStepsPerTurn: 0,
    aAxisDiameter: 0,
    useBlower: false,
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
    diagonal: false,        // lw.raster-to-gcode: Go diagonally (increase the distance between points)
    _docs_visible: true,
});

export const OPERATION_DEFAULTS = (state) => {
    if (!state) state=GlobalStore().getState()
    return {
        laserDiameter: state.settings.machineBeamDiameter,
        useBlower: state.settings.machineBlowerEnabled,
        startHeight: isFinite(state.settings.machineZStartHeight) ? state.settings.machineZStartHeight : '',
    }
}

export function operation(state, action) {
    state = operationBase(state, action);
    switch (action.type) {
        case 'OPERATION_REMOVE_DOCUMENT':
            if (action.payload.id === state.id)
                if (action.payload.isTab)
                    return { ...state, tabDocuments: state.tabDocuments.filter(d => d !== action.payload.document) }
                else
                    return { ...state, documents: state.documents.filter(d => d !== action.payload.document) }
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
            return arrayMove(state.slice(), index, newIndex);
        case 'OPERATION_SET_ATTRS':
            if (action.payload.attrs.expanded)
                state = state.map(op => ({ ...op, expanded: op.id === action.payload.id }));
            break;
        case 'OPERATION_ADD':
            state = state.map(op => ({ ...op, expanded: op.id === action.payload.attrs.id }));
            break;
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
