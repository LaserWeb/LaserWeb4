import { objectNoId } from '../reducers/object'
import {Keys} from 'react-keydown';



import omit from 'object.omit'


const initialState = require("../data/macros.json");


export const macros = (state = initialState, action) => {

    
        switch (action.type) {
            case "MACROS_SET_ATTRS":
                return Object.assign({}, state, action.payload.attrs);
                
            case "MACROS_REMOVE":
                return omit(state,action.payload);
                
                
            default:
                return state;
        }
    
}