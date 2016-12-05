import { setAttrs, add, remove } from '../actions/object'


export const setMacro = setAttrs('macros');
export const addMacro = add('macros');
export const removeMacro = remove('macros');