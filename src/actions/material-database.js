import { setAttrs } from '../actions/object'

/*MATERIAL_OPERATIONS*/
export const setMaterialOperationAttrs = (materialId, operationIndex, attrs) => ({type:"MATERIAL_SET_OPERATION_ATTRS", payload: { materialId, operationIndex, attrs}});
export const setMaterialToggle = (materialId) => ({type:"MATERIAL_SET_TOGGLE", payload: {materialId}});
