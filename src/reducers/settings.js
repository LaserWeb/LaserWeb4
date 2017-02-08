import { objectNoId } from '../reducers/object'
import Validator from 'validatorjs';
import {GlobalStore} from '../index';

const version = require("../../package.json").version;

 /*
        {
             "__version": "Laserweb 0.4 alpha",
            "__timestamp" : "2016-10-28 12:00:00",
            
            "toolCncMode": "Disable",
            "debug": "undefined",
            
            "dpiBitmap": 300,
            "dpiDefault": 72,
            "dpiIllustrator": 72,
            "dpiInkscape": 96,
            
            "gcodeStart":"",
            "gcodeEnd":"",
            "gcodeHoming":";$H",
            "gcodeToolOn":"M3",
            "gcodeToolOff":"M5",
            "gcodeToolTestPower":"0",
            "gcodeToolTestDuration":"0",
            
            "machineWidth": 420,
            "machineHeight": 297,
            "machineBeamDiameter": 0.2,
            
            "jogFeedXY": 2000,
            "jogFeedZ": 10,
            
            "imagePosition": "BottomLeft",
            
            "lasermultiply": 255,
            
            "lastJogSize": 10,
            "lastUsedBaud": "115200",
            "lastUsedPort": "/dev/cu.wchusbserial1420",
            "loglevel": "ERROR",
            "rapidspeed": "30",
            "toolSafetyLockDisabled": "Disable",
            "smoothieIp": "",
            
            
            "subnet1": "",
            "subnet2": "",
            "subnet3": "",
            "tour_current_step": "0",
            "tour_end": "yes",
            "useNumPad": "Disable",
            "useVideo": "Disable",
            "webcamUrl": "",
            "wifisubnet1": "",
            "wifisubnet2": "",
            "wifisubnet3": ""
        }
    
*/
 


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
    
}


export function ValidateSettings(bool=true, rules=SETTINGS_VALIDATION_RULES, settings=null) {

    if (!settings)
        settings=Object.assign({},GlobalStore().getState().settings)

    let check = new Validator(settings, rules );
    
    if (bool) 
        return check.passes();
    
    return check;
}

export const settings = objectNoId('settings', {
    
    __version: version,
    __selectedProfile:null,
    
    machineWidth: 300,
    machineHeight: 300,
    machineBeamDiameter: 0.2,
    
    machineZEnabled: false,
    machineZMatThickness: 0,
    machineZToolOffset: 0,

    machineBlowerEnabled: false,
    machineBlowerGcodeOn: '',
    machineBlowerGcodeOff: '',
    
    pxPerInch: 96,
    dpiRasterBmp:300,
    
    toolSafetyLockDisabled:false,
    toolCncMode:false,
    toolImagePosition: "BL",
    toolUseNumpad: false,
    toolVideoDevice: null,
    toolVideoPerspective: null,
    toolVideoLens: {a:1,b:1,F:1,scale:1},
    toolVideoFov: {x:1,y:1},
    toolWebcamUrl:"",
    toolFeedUnits: 'mm/min',
    
    gcodeStart: "G21         ; Set units to mm\r\nG90         ; Absolute positioning\r\n",
    gcodeEnd: "M2          ; End\r\n",
    gcodeHoming:"",
    gcodeToolOn:"",
    gcodeToolOff:"",
    gcodeSMaxValue: 1,
    gcodeToolTestPower: 0, 
    gcodeToolTestDuration: 0,
    
    commServerIP: 'localhost:8000',
    commServerConnect: false,

    connectVia: 'USB',
    connectPort: '',
    connectBaud: '',
    connectIP: '',

    jogStepsize: 1,
});
