import { humanFileSize } from '../lib/helpers';

export const GCODE_INITIALSTATE = {
    gcoding: { enable: false, percent: 0},
    content: '',
    dirty: false,
}

export function gcode(state = GCODE_INITIALSTATE, action) {

    if (action.type.match(/^(DOCUMENT|OPERATION)_/gi)) {
        if (action.type=='DOCUMENT_SET_ATTRS'){
            if (!action.payload.attrs.hasOwnProperty('visible') && !action.payload.attrs.hasOwnProperty('selected'))
                return Object.assign(state, {dirty: true })
        }
        if (action.type=='OPERATION_SET_ATTRS'){
            if (!action.payload.attrs.hasOwnProperty('expanded') && !action.payload.attrs.hasOwnProperty('_docs_visible')){
                return Object.assign(state, {dirty: true })
            }
        }
    }
    if (action.type === 'GCODE_SET') {
        if (action.payload.length == 0) {
            $('#gcode-info-panel').html("No Gcode loaded")
        } else {
            $('#gcode-info-panel').html("Gcode Loaded:\n" + humanFileSize(action.payload.length) )
        }
        return { ...state, dirty: false , content: action.payload };
    }
    else if (action.type === 'GCODE_GENERATION')
        return { ...state, gcoding: action.payload }
    else if (action.type== 'WORKSPACE_RESET') {
        $('#gcode-info-panel').html("No Gcode loaded");
        return { ...state, dirty: false, content:''}
    }
    else
        return state;
}
