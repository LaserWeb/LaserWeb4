
import omit from 'object.omit'


const initialState = require("../data/material-database.json");


export const materialDatabase = (state = initialState, action) => {

    
        switch (action.type) {
            case "MATERIAL_ADD":
                if (!lock.exec(action.payload.id)) 
                    return Object.assign({}, state, {[action.payload.id]:  action.payload.material});
                return state;
                
            case "MATERIAL_REMOVE":
                return omit(state,(val,key)=>{return key!==action.payload.id});
                
            default:
                return state;
        }
    
}