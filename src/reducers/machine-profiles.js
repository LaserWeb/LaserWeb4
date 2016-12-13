
import omit from 'object.omit'
import Validator from 'validatorjs';
import {GlobalStore} from '../index';

const initialState = require("../data/lw.machines/machine-profiles.json");

export const MATERIALDATABASE_VALIDATION_RULES = {
    thickness: 'numeric|min:0.1',
    name: 'required'
}


export function ValidateMaterial(bool=true, rules=SETTINGS_VALIDATION_RULES, data=null) {

    if (!data)
        data=Object.assign({},GlobalStore().getState().materialdatabase)

    let check = new Validator(data, rules );
    
    if (bool) 
        return check.passes();
    
    return check;
}




export const machineProfiles = (state = initialState, action, lock=/^\*/gi) => {

    
        switch (action.type) {
            case "MACHINEPROFILES_ADD":
                if (!lock.exec(action.payload.id)) 
                    return Object.assign({}, state, {[action.payload.id]:  action.payload.machine});
                return state;
                
            case "MACHINEPROFILES_REMOVE":
                return omit(state,(val,key)=>{return key!==action.payload.id && (!lock || !action.payload.id.match(lock))});
            
            case "MACHINEPROFILES_LOAD":
                let allowed=omit(action.payload.machines,(val,key) => { return !key.match(lock)});
                return Object.assign({}, state, allowed);
                
                
            default:
                return state;
        }
    
}