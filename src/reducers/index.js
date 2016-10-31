import { combineReducers } from 'redux'

import { camera, resetCamera } from './camera'
import { documents } from './document'
import { operations, fixupOperations } from './operation'
import panes from './panes'
import { settings } from './settings'
import { splitters } from './splitters'

const combined = combineReducers({ camera, documents, operations, panes, settings, splitters });

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_RESET':
            return {...state, camera: resetCamera(state.camera, state.settings) };
        case 'DOCUMENT_REMOVE':
            state = combined(state, action);
            return {...state, operations: fixupOperations(state.operations, state.documents) };
        default:
            return combined(state, action);
    }
}
