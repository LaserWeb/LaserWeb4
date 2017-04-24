import { undoCombineReducers, shouldSaveUndo } from './undo'

import { camera, resetCamera } from './camera'
import { documents, documentsLoad } from './document'
import { gcode } from './gcode'
import { operations, currentOperation, operationsAddDocuments, fixupOperations } from './operation'
import panes from './panes'
import { settings } from './settings'
import { splitters } from './splitters'
import { workspace } from './workspace'

import { machineProfiles } from './machine-profiles'
import { materialDatabase } from './material-database'
import { macros } from './macros'
import { com } from './com'

import omit from 'object.omit';
import { deepMerge } from '../lib/helpers'

const combined = undoCombineReducers({ camera, documents, operations, currentOperation, gcode, panes, settings, splitters, workspace, machineProfiles, materialDatabase, macros, com }, {}, shouldSaveUndo);

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_RESET':
            return { ...state, camera: resetCamera(state.camera, state.settings) };
        case 'DOCUMENT_REMOVE':
            state = combined(state, action);
            return { ...state, operations: fixupOperations(state.operations, state.documents) };
        case 'DOCUMENT_LOAD':
            return { ...state, documents: documentsLoad(state.documents, state.settings, action) };
        case 'OPERATION_ADD_DOCUMENTS':
            state = combined(state, action);
            return { ...state, operations: operationsAddDocuments(state.operations, state.documents, action) };
        case "SNAPSHOT_UPLOAD":
            let newState = omit(action.payload.snapshot, ["history"]);
            //if (action.payload.keys) newState = omit(newState, (val, key) => { return action.payload.keys.includes(key) })
            newState = Object.assign(newState, { gcode: { ...state.gcode, dirty: true } })

            return reducer(Object.assign({}, state, deepMerge(action.getState(), newState)), { type: 'LOADED' });
        default:
            return combined(state, action);
    }
}
