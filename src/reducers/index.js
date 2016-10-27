import { combineReducers } from 'redux'

import { camera, resetCamera } from './camera'
import { documents } from './document'
import panes from './panes'
import { settings } from './settings'

const combined = combineReducers({ camera, documents, panes, settings });

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_RESET':
            return {...state, camera: resetCamera(state.camera, state.settings) };
        default:
            return combined(state, action);
    }
}