import { objectNoId } from '../reducers/object'


export const machineProfiles = objectNoId('machineProfiles', {
    "*gen_grbl": {
        machineLabel: "Generic GRBL machine",
        machineDescription: "Use this if you have a GRBL machine",
        settings: {
            machineWidth: 300,
            machineHeight: 300,
            machineBeamDiameter: 0.2,
            
            toolSafetyLockDisabled:false,
            toolCncMode:false,
            toolImagePosition: "BL",
            toolUseNumpad: false,
            toolUseVideo: false,
            toolWebcamUrl:"",
            
            
            gcodeStart: "G21         ; Set units to mm\r\nG90         ; Absolute positioning\r\n",
            gcodeEnd: "M2          ; End\r\n",
            gcodeHoming:"",
            gcodeLaserOn:"M3",
            gcodeLaserOff:"M5",
        }
    },
    "*gen_smoothie": {
        machineLabel: "Generic SMOOTHIE machine",
        machineDescription: "Use this if you have a SMOOTHIE machine",
        settings: {
            machineWidth: 300,
            machineHeight: 300,
            machineBeamDiameter: 0.2,
            
            toolSafetyLockDisabled:false,
            toolCncMode:false,
            toolImagePosition: "BL",
            toolUseNumpad: false,
            toolUseVideo: false,
            toolWebcamUrl:"",
            
            
            gcodeStart: "G21         ; Set units to mm\r\nG90         ; Absolute positioning\r\n",
            gcodeEnd: "M2          ; End\r\n",
            gcodeHoming:"",
            gcodeLaserOn:"M3",
            gcodeLaserOff:"M5",
        }
                                                              
    }
});


