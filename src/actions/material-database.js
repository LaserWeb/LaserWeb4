import { setAttrs } from '../actions/object'

/*MATERIAL_OPERATIONS*/
export const setMaterialAttrs = (materialId, attrs) => ({type:"MATERIAL_SET_ATTRS", payload: { materialId, attrs}});
export const setMaterialOperationAttrs = (materialId, operationIndex, attrs) => ({type:"MATERIAL_SET_OPERATION_ATTRS", payload: { materialId, operationIndex, attrs}});

export const toggleMaterialView = (materialId) => ({type:"MATERIAL_TOGGLE_VIEW", payload: {materialId}});

export const toggleMaterialOperationEdit = (materialId, operationIndex) => ({type:"MATERIAL_OPERATION_TOGGLE_EDIT", payload: {materialId, operationIndex}});
export const toggleMaterialEdit = (materialId) => ({type:"MATERIAL_TOGGLE_EDIT", payload: {materialId}});

export const deleteMaterialOperation = (materialId, operationIndex)  => ({type:"MATERIAL_OPERATION_DELETE", payload: {materialId, operationIndex}});
export const deleteMaterial = (materialId)  => ({type:"MATERIAL_DELETE", payload: {materialId}});

export const addMaterial = (materialId)=> ({type:"MATERIAL_ADD", payload: {materialId}});