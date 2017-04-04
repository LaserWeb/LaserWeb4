
const initialState = {
    serverConnected: false,
    machineConnected: false,
    playing: false,
    paused:false,

    comInterfaces:[],
    comPorts:[]
}

export function com(state = initialState, action) {
    return state;
}
