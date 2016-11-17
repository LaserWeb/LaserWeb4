import { setAttrs } from '../actions/object'

/*SETTINGS*/
export const setSettingsAttrs = setAttrs('settings');
export const uploadSettings = (file, content) => ({ /*SETTINGS_UPLOAD*/ type:"SETTINGS_SET_ATTRS", payload: {attrs:JSON.parse(content)}});
export const downloadSettings = (settings) => ({ type:"SETTINGS_DOWNLOAD", payload: settings});

/*MACHINEPROFILES*/
export const addMachineProfile =  (id, machine) => ({type: 'MACHINEPROFILES_ADD', payload: {id, machine}})
export const delMachineProfileId = (id) => ({type: 'MACHINEPROFILES_REMOVE', payload: {id}})
export const uploadMachineProfiles = (file, content) => ({ type:"MACHINEPROFILES_UPLOAD", payload: {file, machines:JSON.parse(content)}});
export const downloadMachineProfiles = (machines) => ({ type:"MACHINEPROFILES_DOWNLOAD", payload: {machines}});

/*SNAPSHOT*/
export const uploadSnapshot = (file, content) => ({ type:"SNAPSHOT_UPLOAD", payload: {file, snapshot:JSON.parse(content)}});
export const downloadSnapshot = (snapshot) => ({ type:"SNAPSHOT_DOWNLOAD", payload: {snapshot}});
export const storeSnapshot = (key, content) => ({ type:"SNAPSHOT_STORE", payload: {key, content}});