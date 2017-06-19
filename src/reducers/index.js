import { undoCombineReducers, shouldSaveUndo } from './undo'

import { camera, zoomArea } from './camera'
import { documents, documentsLoad } from './document'
import { gcode } from './gcode'
import { operations, currentOperation, operationsAddDocuments, fixupOperations } from './operation'
import panes from './panes'
import { settings } from './settings'
import { splitters } from './splitters'
import { workspace } from './workspace'

import { machineProfiles } from './machine-profiles'
import { materialDatabase } from './material-database'
import { com } from './com'

import omit from 'object.omit';
import { deepMerge } from '../lib/helpers'

const combined = undoCombineReducers({ camera, documents, operations, currentOperation, gcode, panes, settings, splitters, workspace, machineProfiles, materialDatabase, com }, {}, shouldSaveUndo);

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_ZOOM_AREA':
            return { ...state, camera: zoomArea(state.camera, state.settings, state.workspace, action) };
        case 'DOCUMENT_REMOVE':
        case "DOCUMENT_REMOVE_SELECTED":
            state = combined(state, action);
            return { ...state, operations: fixupOperations(state.operations, state.documents) };
        case 'DOCUMENT_LOAD':
            return { ...state, documents: documentsLoad(state.documents, state.settings, action) };
        case 'OPERATION_ADD_DOCUMENTS':
            state = combined(state, action);
            return { ...state, operations: operationsAddDocuments(state.operations, state.documents, action) };
        case "SNAPSHOT_UPLOAD":
            let newState = omit(action.payload.snapshot, ["history"]);
                newState = Object.assign(newState, { gcode: { ...state.gcode, dirty: true } })
                newState = Object.assign({}, state, deepMerge(action.getState(), newState));
            return reducer(newState, { type: 'LOADED', payload: newState });
        default:
            return combined(state, action);
    }
}
