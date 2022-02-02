import { getMillGcodeFromOp } from '../cam-gcode-mill'

onmessage = (event) => {

    const {settings, opIndex, op, geometry=[], openGeometry=[], tabGeometry=[]} = event.data
    const errors = [];

    const showAlert = (message, level) => {
        errors.push({ message, level })
    };
    const progress = () => {
        postMessage(JSON.stringify({ event: "onProgress", gcode, errors }))
    };
    const done = (gcode) => {
        if (gcode === false && errors.length) {
            postMessage(JSON.stringify({ event: "onError", errors }))
        } else {
            postMessage(JSON.stringify({ event: "onDone", gcode }))
        }
    };

    getMillGcodeFromOp.apply(this, [settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress])

}