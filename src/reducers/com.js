
import { objectNoId } from '../reducers/object'

export const COM_INITIALSTATE = {
    serverConnected: false,
    machineConnected: false,
    playing: false,
    paused:false,

    comInterfaces:[],
    comPorts:[],

    laserTestOn: false,
    feedOverride:'',
    spindleOverride: '',
    queued:0,
    status:'idle',
    jobStartTime: null,

}

export const com = objectNoId('com', COM_INITIALSTATE)
