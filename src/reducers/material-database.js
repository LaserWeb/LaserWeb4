
import omit from 'object.omit'
import {deepMerge} from "../lib/helpers"
import generateName from 'sillyname'
import uuid from 'node-uuid';

const initialState = require("../data/material-database.json");

function generateInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const MATERIAL_TEMPLATE=()=>{
    return {
        id: uuid.v4(),
        material:{
            isEditable:false,
            name: generateName(),
            thickness: generateInteger(1,10)+"mm",
            notes:""
        },
        operations:[]
    }
}

const MATERIAL_OPERATION_TEMPLATE=(type, machineProfile=null)=>{
    return {
        machine_profile:machineProfile,
        type:type,
        name: "** "+generateName()+" **",
        notes:"",
        params:{}
    }
  
}

export const materialDatabase = (state = initialState, action) => {

    
        switch (action.type) {
            case "MATERIAL_ADD":
                state = [...state, MATERIAL_TEMPLATE()];
                return state;
                
            case "MATERIAL_DELETE":
                return state.filter((material)=>{
                    return (material.id !== action.payload.materialId);
                })
            
            case "MATERIAL_SET_ATTRS":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.material=deepMerge(material.material, action.payload.attrs)
                    
                    return material;
                })
            
            case "MATERIAL_SET_OPERATION_ATTRS":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.operations=material.operations.map((operation,i)=> {
                            if (i!==action.payload.operationIndex)
                                return operation;
                            
                            operation=deepMerge(operation, action.payload.attrs)
                            
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
                        
                    
                    material.operations=material.operations.map((operation, i) =>{
                        operation.isEditable=false;
                        return operation;    
                    })
                    
                    material.material.isEditable=!material.material.isEditable;
                    return material;
                    
                })
            
            case "MATERIAL_OPERATION_ADD":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                      
                    material.operations=[...material.operations, MATERIAL_OPERATION_TEMPLATE(action.payload.operationType, action.payload.machineProfile)]
                    
                    return material;
                });
            
            case "MATERIAL_OPERATION_DELETE":
                return state.map((material) => {
                    if (material.id !== action.payload.materialId)
                        return material;
                    
                    material.operations=material.operations.filter((operation,i)=> {
                            return (i!==action.payload.operationIndex)
                    })
                    
                    return material;
                })
                
            
            default:
                return state;
        }
    
}

