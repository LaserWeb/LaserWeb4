export function gcode(state = '', action) {
    if (action.type === 'GCODE_SET')
        return action.payload;
    else
        return state;
}
