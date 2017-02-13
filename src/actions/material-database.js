import { setAttrs } from '../actions/object'

/*MATERIALDB_BRANCH*/
export const addBranch = ()=> ({type:"MATERIALDB_BRANCH_ADD"});
export const deleteBranch = (branchId)  => ({type:"MATERIALDB_BRANCH_DELETE", payload: branchId});
export const setBranchAttrs = (branchId, attrs) => ({type:"MATERIALDB_BRANCH_SET_ATTRS", payload: { branchId, attrs}});
export const toggleBranchView = (branchId) => ({type:"MATERIALDB_BRANCH_TOGGLE_VIEW", payload: branchId});
export const toggleBranchEdit = (branchId) => ({type:"MATERIALDB_BRANCH_TOGGLE_EDIT", payload: branchId});

/*MATERIALDB_LEAF (operations)*/
export const addLeaf = (branchId, attrs={}) =>({type:"MATERIALDB_LEAF_ADD", payload:{branchId, attrs}})
export const deleteLeaf = (leafId)  => ({type:"MATERIALDB_LEAF_DELETE", payload: leafId});
export const setLeafAttrs = (leafId, attrs) => ({type:"MATERIALDB_LEAF_SET_ATTRS", payload: { leafId, attrs}});
export const toggleLeafEdit = (leafId) => ({type:"MATERIALDB_LEAF_TOGGLE_EDIT", payload: leafId});

/*MATERIALDB*/
export const uploadMaterialDatabase = (file, content) => ({ type:"MATERIALDB_UPLOAD", payload: {file, database:JSON.parse(content)}});
export const downloadMaterialDatabase = (database) => ({ type:"MATERIALDB_DOWNLOAD", payload: {database}});

/*MATERIALDB PICKER*/
export const applyMaterialDatabase = (leafId) => ({ type: "MATERIALDB_APPLY", payload: leafId});
