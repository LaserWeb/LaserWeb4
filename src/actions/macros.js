import { setAttrs, add, remove } from '../actions/object'


export const setMacro = setAttrs('macros');
export const addMacro = add('macros');
export const removeMacro = remove('macros');

export function fireMacroById(keybinding, macros) {
    let macro = Object.values(macros).find((i) => i.keybinding === keybinding);
    if (macro) {
        let { label, gcode } = macro;
        return { type: 'MACRO_FIRE', payload: { keybinding, label, gcode } }
    }
    return null;
}