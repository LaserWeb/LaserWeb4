
export const addMachineProfile =  (id, machine) => ({type: 'MACHINEPROFILES_ADD', payload: {id, machine}})
export const delMachineProfileId = (id) => ({type: 'MACHINEPROFILES_REMOVE', payload: {id}})

export const uploadMachineProfiles = (file, content) => ({ type:"MACHINEPROFILES_LOAD", payload: {file, machines:JSON.parse(content)}});
export const downloadMachineProfiles = (machines) => ({ type:"MACHINEPROFILES_DOWNLOAD", payload: {machines}});