import { objectNoId } from '../reducers/object'

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
            "gcodeLaserOn":"M3",
            "gcodeLaserOff":"M5",
            
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



export const settings = objectNoId('settings', {
    machineWidth: 300,
    machineHeight: 300,
    machineBeamDiameter: 0.2,
    
    dpiDefault: 96,
    dpiIllustrator: 72,
    dpiInkscape: 96,
    dpiRasterBmp:300,
    
    toolSafetyLockDisabled:false,
    toolCncMode:false,
    
    gcodeStart:"",
    gcodeEnd:"",
    gcodeHoming:"",
    gcodeLaserOn:"",
    gcodeLaserOff:"",
    
});
