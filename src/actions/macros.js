import { setAttrs, add, remove } from '../actions/object'


export const setMacro = setAttrs('macros');
export const addMacro = add('macros');
export const removeMacro = remove('macros');

export function fireMacroByKeyboard(ev, macros) {
    let keybinding = [ev.shiftKey ? 'shift' : undefined, ev.ctrlKey ? 'ctrl' : undefined, ev.metaKey ? 'command' : undefined, ev.altKey ? 'alt' : undefined, ev.key].filter((item) => { return item }).sort().join('+').toLowerCase()
    let macro = macros.find((i) => i.keybinding === keybinding);
    if (macro) {
        let { label, gcode } = macro;
        return { type: 'MACRO_FIRE', payload: { keybinding, label, gcode } }
    }
    return null;
}

export function fireMacroById(keybinding, macros) {
    let macro = macros.find((i) => i.keybinding === keybinding);
    if (macro) {
        let { label, gcode } = macro;
        return { type: 'MACRO_FIRE', payload: { keybinding, label, gcode } }
    }
    return null;
}