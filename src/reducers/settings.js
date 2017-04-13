import { objectNoId } from '../reducers/object'
import Validator from 'validatorjs';
import {GlobalStore} from '../index';

const version = require("../../package.json").version;
 
export const SETTINGS_VALIDATION_RULES = {
    machineWidth:'numeric|min:100',
    machineHeight:'numeric|min:100',
    
    gcodeSMaxValue: 'required|numeric|min:1',
    gcodeMoveUnits: 'in:mm/s,mm/min',
    gcodeToolTestPower: 'required|numeric|min:0|max:100',
    gcodeToolTestDuration: 'required|numeric|min:0',
    
    machineZEnabled: 'boolean',
    machineBlowerEnabled: 'boolean',
    machineZToolOffset: 'numeric',
    
    toolImagePosition: 'in:TL,TR,C,BL,BR',
    
    jogFeedXY: 'numeric|min:0',
    jogFeedZ: 'numeric|min:0',
    
}


export function ValidateSettings(bool=true, rules=SETTINGS_VALIDATION_RULES, settings=null) {

    if (!settings)
        settings=Object.assign({},GlobalStore().getState().settings)

    let check = new Validator(settings, rules );
    
    if (bool) 
        return check.passes();
    
    return check;
}

export const SETTINGS_INITIALSTATE = {
    
    __version: version,
    __selectedProfile: null,
    
    machineWidth: 300,
    machineHeight: 200,
    machineBeamDiameter: 0.2,
    machineOriginX: 0,
    machineOriginY: 0,
    
    machineZEnabled: false,
    machineZMatThickness: 0,
    machineZToolOffset: 0,
    machineZStartHeight : '',

    machineBlowerEnabled: false,
    machineBlowerGcodeOn: '',
    machineBlowerGcodeOff: '',
    
    pxPerInch: 96,
    dpiBitmap: 300,
    
    toolSafetyLockDisabled: true,
    toolCncMode: false,
    toolImagePosition: "BL",
    toolUseNumpad: false,

    toolVideoDevice: null,
    toolVideoPerspective: {enabled:false},
    toolVideoLens: {a:1,b:1,F:1,scale:1},
    toolVideoFov: {x:1,y:1},
    toolVideoResolution: "720p(HD)",

    toolWebcamUrl: "",
    toolFeedUnits: 'mm/min',
    toolTestSValue: 1, 
    toolTestDuration: 0,
    
    gcodeStart: "G21         ; Set units to mm\r\nG90         ; Absolute positioning\r\n",
    gcodeEnd: "M5          ; Switch tool offEnd\r\nM2          ; End\r\n",
    gcodeHoming:"",
    gcodeToolOn:"",
    gcodeToolOff:"",
    gcodeSMaxValue: 1,
    gcodeCheckSizePower: 0, 
    gcodeToolTestPower: 0, 
    gcodeToolTestDuration: 0,
    
    comServerVersion: 'not connected',
    comServerIP: 'localhost:8000',
    comServerConnect: false,
    comInterfaces: [],
    comPorts: [],
    connectVia: '',
    connectPort: '',
    connectBaud: '115200',
    connectIP: '',

    jogStepsize: 1,
    jogFeedXY: 1800,
    jogFeedZ: 300,
    jogAccumulatedJobTime: 0,
}

export const settings = objectNoId('settings', SETTINGS_INITIALSTATE);
