
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
            
            case "MATERIAL_SET_OPERATION_ATTRS":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.operations=material.operations.map((operation,i)=> {
                            if (i!==action.payload.operationIndex)
                                return operation;
                            
                            operation.params=Object.assign({},operation.params, action.payload.attrs)
                            
                            return operation;
                            
                    })
                    
                    return material;
                })
               
                
            case "MATERIAL_SET_TOGGLE" :
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    if (typeof material.isOpened =="undefined")
                        material.isOpened=false;
                        
                    material.isOpened=!material.isOpened;
                    
                    return material;
                })
                
            default:
                return state;
        }
    
}

