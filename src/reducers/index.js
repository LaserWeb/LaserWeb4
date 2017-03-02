import { undoCombineReducers } from './undo'

import { camera, resetCamera } from './camera'
import { documents,documentsLoad } from './document'
import { gcode } from './gcode'
import { operations, currentOperation, operationsAddDocuments, fixupOperations } from './operation'
import panes from './panes'
import { settings } from './settings'
import { splitters } from './splitters'
import { workspace } from './workspace'

import { machineProfiles } from './machine-profiles'
import { materialDatabase } from './material-database'
import { macros } from './macros'

import omit from 'object.omit';

var LAST_ACTION={};
var LAST_ACTION_TIMEOUT=null;
const LAST_ACTION_TTL = 2000;

const BLACKLIST=[/^(@@|redux)/gi, 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO','LOADED',/^SPLITTER|^MATERIALDB_|^SELECT_PANE/gi];

const shouldSaveUndo=(action)=>{
    
    //Last action TTL
    if (LAST_ACTION_TIMEOUT) 
        clearTimeout(LAST_ACTION_TIMEOUT)

    for (let item of BLACKLIST) {
        if (action.type.search(item)>=0) {
            LAST_ACTION=action;
            return false;
        } 
    }
    
    if (action.type===LAST_ACTION.type){
        if (action.type.match(/_SET_ATTRS/gi) ) {
            let cSig=Object.keys(action.payload.attrs).sort().join(',');
            let lSig=Object.keys(LAST_ACTION.payload.attrs).sort().join(',');
            if (cSig === lSig){
                LAST_ACTION_TIMEOUT = setTimeout(()=>{ LAST_ACTION = {} },LAST_ACTION_TTL)
                return false;
            }
        }

        if (action.type.match(/DOCUMENT_TRANSLATE_SELECTED/gi) ) {
            let cSig=Object.keys(action.payload).sort().join(',');
            let lSig=Object.keys(LAST_ACTION.payload).sort().join(',');
            if (cSig === lSig){
                LAST_ACTION_TIMEOUT = setTimeout(()=>{ LAST_ACTION = {} },LAST_ACTION_TTL)
                return false;
            }
        } 
        
    }
    
    LAST_ACTION=action;
       
    return true
};
const combined = undoCombineReducers({ camera, documents, operations, currentOperation, gcode, panes, settings, splitters, workspace, machineProfiles, materialDatabase, macros }, {}, shouldSaveUndo);

export default function reducer(state, action) {
    switch (action.type) {
        case 'CAMERA_RESET':
            return {...state, camera: resetCamera(state.camera, state.settings) };
        case 'DOCUMENT_REMOVE':
            state = combined(state, action);
            return {...state, operations: fixupOperations(state.operations, state.documents) };
        case 'DOCUMENT_LOAD':
            return { ...state, documents: documentsLoad(state.documents, state.settings, action) };
        case 'OPERATION_ADD_DOCUMENTS':
            state = combined(state, action);
            return {...state, operations: operationsAddDocuments(state.operations, state.documents, action) };
        case "SNAPSHOT_UPLOAD":
            let newState=omit(action.payload.snapshot,["history"]);
            if (action.keys) newState = omit(newState,(val,key)=>{ return action.keys.includes(key)})
            return reducer(Object.assign({}, state, newState), { type: 'LOADED' });
        default:
            return combined(state, action);
    }
}
