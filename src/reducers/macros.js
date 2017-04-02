import { objectNoId } from '../reducers/object'
import omit from 'object.omit'

import Validator from 'validatorjs';
import { actionTypes } from 'redux-localstorage'

const initialState = require("../data/macros.json");

export const MACRO_VALIDATION_RULES = {
    label: 'required',
    gcode: 'required'
}


export const macros = (state = initialState, action) => {
    switch (action.type) {
        case "MACROS_SET_ATTRS":
            return Object.assign({}, state, action.payload.attrs);

        case "MACROS_REMOVE":
            return omit(state, action.payload);

        case actionTypes.INIT:
            if (action.payload) {
                let lockedState = {}
                Object.entries(initialState).forEach((vendor) => { let [key,value] = vendor; lockedState[key] = { ...value, _locked: true } });
                return Object.assign(action.payload.macros, lockedState);
            }
            return state;

        default:
            return state;
    }

}