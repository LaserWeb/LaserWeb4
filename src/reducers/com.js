
export const COM_INITIALSTATE = {
    serverConnected: false,
    machineConnected: false,
    playing: false,
    paused:false,

    comInterfaces:[],
    comPorts:[]
}

export function com(state = COM_INITIALSTATE, action) {
    return state;
}
