
import omit from 'object.omit'
import {actionTypes} from 'redux-localstorage'

export const MACHINEPROFILES_INITIALSTATE=((ctx)=>{
    let keys = ctx.keys();
    let values = keys.map(ctx);
    return (Object.assign.apply(null,[{},...values]))
})(require.context('../data/lw.machines/machines', true, /\.json$/gi))


export const machineProfiles = (state = MACHINEPROFILES_INITIALSTATE, action, lock=/^\*/gi) => {
        switch (action.type) {
            case "MACHINEPROFILES_ADD":
                if (!lock.exec(action.payload.id)) 
                    return Object.assign({}, state, {[action.payload.id]:  action.payload.machine});
                return state;
                
            case "MACHINEPROFILES_REMOVE":
                let item = state[action.payload.id]
                if (!item || item._locked) return state;
                return omit(state, action.payload.id);
            
            case "MACHINEPROFILES_LOAD":
                let allowed=omit(action.payload.machines,(val,key) => { return !key.match(lock)});
                return Object.assign({}, state, allowed);
            
            case actionTypes.INIT:
                if (action.payload) {
                    let lockedState = {}
                    Object.entries(MACHINEPROFILES_INITIALSTATE).forEach((vendor) => { let [key,value] = vendor; lockedState[key] = { ...value, _locked: true } });
                    return Object.assign(action.payload.machineProfiles, lockedState);
                }
                return state;

            default:
                return state;
        }
    
}