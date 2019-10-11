import { objectNoId } from '../reducers/object'
import omit from 'object.omit'

import Validator from 'validatorjs';
import { actionTypes } from 'redux-localstorage'

export const MACROS_INITIALSTATE = require("../data/macros.json");

export const MACRO_VALIDATION_RULES = {
    label: 'required',
    gcode: 'required'
}

export const macros = (state = MACROS_INITIALSTATE, action) => {
    switch (action.type) {
        case "MACROS_RESET":
            return MACROS_INITIALSTATE;

        case "MACROS_SET_ATTRS":
            return Object.assign({}, state, action.payload.attrs);

        case "MACROS_REMOVE":
            return omit(state, action.payload);

        // both receives full redux state;
        case "LOADED":
        case actionTypes.INIT:
            if (action.payload) {
                return Object.assign(action.payload.macros || action.payload.settings.macros)  //recover legacy macros data
            }
            return state;

        default:
            return state;
    }

}