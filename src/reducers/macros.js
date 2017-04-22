import { objectNoId } from '../reducers/object'
import omit from 'object.omit'

import Validator from 'validatorjs';
import { actionTypes } from 'redux-localstorage'

export const MACROS_INITIALSTATE = require("../data/macros.json");

export const MACRO_VALIDATION_RULES = {
    label: 'required',
    gcode: 'required'
}

/* unsets all "_locked" and then reapplies. vendor state overwrites user's */
export const lockVendor = (state={}) =>{
    let lockedState = {}
    let storedState = {}
    Object.entries(MACROS_INITIALSTATE).forEach((vendor) => { let [key,value] = vendor; lockedState[key] = { ...value, _locked: true } });
    Object.entries(state).forEach((stored) => { let [key,value] = stored; storedState[key] = { ...value, _locked: false } });
    return Object.assign(storedState,lockedState);
}

const __INITIAL = lockVendor()

export const macros = (state = __INITIAL, action) => {
    switch (action.type) {
        case "MACROS_SET_ATTRS":
            return Object.assign({}, state, action.payload.attrs);

        case "MACROS_REMOVE":
            return omit(state, action.payload);

        case actionTypes.INIT:
            if (action.payload) {
                return lockVendor(action.payload.macros || action.payload.settings.macros)  //recover legacy macros data
            }
            return state;

        default:
            return state;
    }

}