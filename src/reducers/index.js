import { undoCombineReducers } from './undo'

import { camera, resetCamera } from './camera'
import { documents } from './document'
import { gcode } from './gcode'
import { operations, currentOperation, operationsAddDocuments, fixupOperations } from './operation'
import panes from './panes'
import { settings } from './settings'
import { splitters } from './splitters'
import { workspace } from './workspace'

import { machineProfiles } from './machine-profiles'

import omit from 'object.omit';

const shouldSaveUndo=(action)=>{
    let blackList=['@@INIT', 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO'];
    let should= !(blackList.includes(action.type) || action.type.match(/^SPLITTER/));

    return should;
};
const combined = undoCombineReducers({ camera, documents, operations, currentOperation, gcode, panes, settings, splitters, workspace, machineProfiles }, shouldSaveUndo);

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_RESET':
            return {...state, camera: resetCamera(state.camera, state.settings) };
        case 'DOCUMENT_REMOVE':
            state = combined(state, action);
            return {...state, operations: fixupOperations(state.operations, state.documents) };
        case 'OPERATION_ADD_DOCUMENTS':
            state = combined(state, action);
            return {...state, operations: operationsAddDocuments(state.operations, state.documents, action) };
        
        case "SNAPSHOT_UPLOAD":
            let newState=omit(action.payload.snapshot,["history"]);
            return Object.assign({}, state, newState);
        
        default:
            return combined(state, action);
    }
}
