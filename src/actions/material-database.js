import { setAttrs } from '../actions/object'

/*MATERIAL*/
export const addMaterial = (materialId)=> ({type:"MATERIAL_ADD", payload: {materialId}});
export const deleteMaterial = (materialId)  => ({type:"MATERIAL_DELETE", payload: {materialId}});
export const setMaterialAttrs = (materialId, attrs) => ({type:"MATERIAL_SET_ATTRS", payload: { materialId, attrs}});
export const toggleMaterialView = (materialId) => ({type:"MATERIAL_TOGGLE_VIEW", payload: {materialId}});
export const toggleMaterialEdit = (materialId) => ({type:"MATERIAL_TOGGLE_EDIT", payload: {materialId}});

/*MATERIAL_OPERATIONS*/
export const addMaterialOperation = (materialId, operationType, machineProfile=null) =>({type:"MATERIAL_OPERATION_ADD", payload:{materialId, operationType, machineProfile}})
export const deleteMaterialOperation = (materialId, operationIndex)  => ({type:"MATERIAL_OPERATION_DELETE", payload: {materialId, operationIndex}});
export const setMaterialOperationAttrs = (materialId, operationIndex, attrs) => ({type:"MATERIAL_SET_OPERATION_ATTRS", payload: { materialId, operationIndex, attrs}});
export const toggleMaterialOperationEdit = (materialId, operationIndex) => ({type:"MATERIAL_OPERATION_TOGGLE_EDIT", payload: {materialId, operationIndex}});

/*MATERIAL DB*/
export const uploadMaterialDatabase = (file, content) => ({ type:"MATERIAL_DB_UPLOAD", payload: {file, database:JSON.parse(content)}});
export const downloadMaterialDatabase = (database) => ({ type:"MATERIAL_DB_DOWNLOAD", payload: {database}});

/*MATERIAL PICKER*/

export const applyMaterial = (materialId, operationIndex) => ({ type: "MATERIAL_APPLY", payload: { materialId, operationIndex }});
