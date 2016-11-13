import { setAttrs } from '../actions/object'

export const setMachineProfileAttrs = setAttrs('machineProfiles');

export const delMachineProfileId = (machineId) => ({type: 'MACHINEPROFILES_MACHINEID_REMOVE', payload: {machineId}})