
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
               
                
            case "MATERIAL_TOGGLE_VIEW" :
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    if (typeof material.isOpened =="undefined")
                        material.isOpened=false;
                        
                    material.isOpened=!material.isOpened;
                    
                    return material;
                })
            
            case "MATERIAL_OPERATION_TOGGLE_EDIT":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.operations=material.operations.map((operation,i)=> {
                            if (i!==action.payload.operationIndex)
                                return operation;
                            
                            if (typeof operation.isEditable =="undefined")
                                operation.isEditable=false;
                            
                            operation.isEditable=!operation.isEditable;
                            
                            return operation;
                            
                    })
                    
                    return material;
                })
            
            case "MATERIAL_TOGGLE_EDIT":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    
                    if (typeof material.material.isEditable =="undefined")
                        material.material.isEditable=false;
                    
                    material.material.isEditable=!material.material.isEditable;
                    return material;
                    
                })
            
            case "MATERIAL_OPERATION_DELETE":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.operations=material.operations.filter((operation,i)=> {
                            return (i!==action.payload.operationIndex)
                    })
                    
                    return material;
                })
                
            case "MATERIAL_DELETE":
                return state.filter((material)=>{
                    return (material.id !== action.payload.materialId);
                })
            default:
                return state;
        }
    
}

