
const initialState = {
    gcoding: { enable: false, percent: 0 },
    content: '',
}

export function gcode(state = initialState, action) {
    if (action.type === 'GCODE_SET')
        return { ...state, content: action.payload };
    else if (action.type === 'GCODE_GENERATION')
        return { ...state, gcoding: action.payload }
    else
        return state;
}
