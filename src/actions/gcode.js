export function setGcode(gcode) {
    return { type: 'GCODE_SET', payload: gcode };
}
