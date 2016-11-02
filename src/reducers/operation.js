"use strict";

import { getParentIds, object, objectArray } from '../reducers/object'

const operationBase = object('operation', {
    documents: [],
    expanded: false,
    type: 'Laser Engrave',
    direction: 'Conventional',
    laserPower: 100,
    laserDiameter: 6.35,
    toolDiameter: 6.35,
    margin: 0,
    cutWidth: 0,
    stepOver: 0.4,
    passDepth: 0,
    cutDepth: 0,
    plungeRate: 0,
    cutRate: 0,
});

export function operation(state, action) {
    state = operationBase(state, action);
    switch (action.type) {
        case 'OPERATION_REMOVE_DOCUMENT':
            if (action.payload.id === state.id)
                return {...state, documents: state.documents.filter(d => d !== action.payload.document) }
    }
    return state;
}

export const operations = objectArray('operation', operation);

export function operationsAddDocuments(state, documents, action) {
    return state.map(operation => {
        if (operation.id !== action.payload.id)
            return operation;
        let combined = [...operation.documents];
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
