import { setAttrs } from '../actions/object'

export const setSettingsAttrs = setAttrs('settings');

export const uploadSettings = (file, content) => ({ /*SETTINGS_UPLOAD*/ type:"SETTINGS_SET_ATTRS", payload: {attrs:JSON.parse(content)}});
export const downloadSettings = (settings) => ({ type:"SETTINGS_DOWNLOAD", payload: settings});
