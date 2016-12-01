
import omit from 'object.omit'


const initialState = require("../data/lw.machines/machine-profiles.json");


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