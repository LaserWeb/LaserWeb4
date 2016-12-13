"use strict";

import { getParentIds, object, objectArray } from '../reducers/object'

import arrayMove from 'array-move'

const operationBase = object('operation', {
    documents: [],
    tabDocuments: [],
    expanded: false,
    type: 'Laser Cut',
    filterFillColor: null,
    filterStrokeColor: null,
    union: true,
    direction: 'Conventional',
    laserPower: 100,
    laserDiameter: 0,
    toolDiameter: 0,
    lineDistance: 0,
    margin: 0,
    passes: 0,
    cutWidth: 0,
    stepOver: 0.4,
    passDepth: 0,
    cutDepth: 0,
    tabDepth: 0,
    clearance: 0,
    plungeRate: 0,
    cutRate: 0,
    toolAngle: 0,
    useA: false,
    aAxisStepsPerTurn: 0,
    aAxisDiameter: 0,
});

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
    switch (action.type) {
        case 'OPERATION_MOVE_CURRENT':
            let index=state.findIndex(item => item.id==action.payload.id)
            let newIndex=index+action.payload.step;
                if (newIndex<0) newIndex=0;
                if (newIndex>state.length-1) newIndex=state.length-1;
            
            return arrayMove(state.slice(),index, newIndex);
        default:
            return objectArray('operation', operation)(state, action);
    }
    
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
