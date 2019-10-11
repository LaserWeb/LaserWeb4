import { setAttrs } from '../actions/object'

/*MATERIALDB_GROUP*/
export const addGroup = () => ({ type: "MATERIALDB_GROUP_ADD" });
export const deleteGroup = (groupId) => ({ type: "MATERIALDB_GROUP_DELETE", payload: groupId });
export const setGroupAttrs = (groupId, attrs) => ({ type: "MATERIALDB_GROUP_SET_ATTRS", payload: { groupId, attrs } });
export const toggleGroupView = (groupId) => ({ type: "MATERIALDB_GROUP_TOGGLE_VIEW", payload: groupId });
export const toggleGroupEdit = (groupId) => ({ type: "MATERIALDB_GROUP_TOGGLE_EDIT", payload: groupId });

/*MATERIALDB_PRESET (operations)*/
export const addPreset = (groupId, attrs = {}) => ({ type: "MATERIALDB_PRESET_ADD", payload: { groupId, attrs } })
export const deletePreset = (presetId) => ({ type: "MATERIALDB_PRESET_DELETE", payload: presetId });
export const setPresetAttrs = (presetId, attrs) => ({ type: "MATERIALDB_PRESET_SET_ATTRS", payload: { presetId, attrs } });
export const togglePresetEdit = (presetId) => ({ type: "MATERIALDB_PRESET_TOGGLE_EDIT", payload: presetId });

/*MATERIALDB PICKER*/
export const applyPreset = (presetId) => ({ type: "MATERIALDB_PRESET_APPLY", payload: presetId });
export const newPreset = (preset, grouping, name) => ({ type: "MATERIALDB_PRESET_NEW", payload: { preset, grouping, name } })

/*MATERIALDB*/
export const uploadMaterialDatabase = (file, content) => ({ type: "MATERIALDB_UPLOAD", payload: { file, database: JSON.parse(content) } });
export const importMaterialDatabase = (file, content) => ({ type: "MATERIALDB_IMPORT", payload: { file, database: content } });
export const downloadMaterialDatabase = (database) => ({ type: "MATERIALDB_DOWNLOAD", payload: { database } });



