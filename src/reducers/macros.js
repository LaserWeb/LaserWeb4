import { objectNoId } from '../reducers/object'
import omit from 'object.omit'

import Validator from 'validatorjs';

const initialState = require("../data/macros.json");

export const MACRO_VALIDATION_RULES = {
    label: 'required',
    keybinding: 'required',
    gcode: 'required'
}


export const macros = (state = initialState, action) => {
    switch (action.type) {
        case "MACROS_SET_ATTRS":
            return Object.assign({}, state, action.payload.attrs);

        case "MACROS_REMOVE":
            return omit(state, action.payload);
        default:
            return state;
    }

}