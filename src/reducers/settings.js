import { objectNoId } from '../reducers/object'
import Validator from 'validatorjs';
import { GlobalStore } from '../index';
import { actionTypes } from 'redux-localstorage'
import { macros, MACROS_INITIALSTATE } from './macros'

export const version = require("../../package.json").version;

export const SETTINGS_VALIDATION_RULES = {
    machineWidth: 'numeric|min:100',
    machineHeight: 'numeric|min:100',

    gcodeLaserIntensity: 'required',
    gcodeSMinValue: 'required|numeric',
    gcodeSMaxValue: 'required|numeric',
    gcodeMoveUnits: 'in:mm/s,mm/min',
    gcodeToolTestPower: 'required|numeric|min:0|max:100',
    gcodeToolTestDuration: 'required|numeric|min:0',
    gcodeConcurrency: 'required|numeric|min:1|max:15',
    gcodeCurvePrecision: 'required|numeric|min:0.1|max:2',

    svgPrecision: 'numeric|min:0|max:16',
    svgFillOpacity: 'numeric|min:0|max:100',

    machineZEnabled: 'boolean',
    machineBlowerEnabled: 'boolean',
    machineMillEnabled: 'boolean',
    machineFluidEnabled: 'boolean',
    machineZToolOffset: 'numeric',

    machineAEnabled: 'boolean',
    machineAAxisDiameter: 'numeric|min:0.01',

    simG0Rate: 'numeric|min:0.01',
    simBarWidth: 'numeric|min:12',

    toolGridWidth: 'numeric|min:100',
    toolGridHeight: 'numeric|min:100',
    toolImagePosition: 'in:TL,TR,C,BL,BR',

    toolGridMinorSpacing: 'numeric|min:0.1',
    toolGridMajorSpacing: 'numeric|min:1',

    jogFeedXY: 'numeric|min:0',
    jogFeedZ: 'numeric|min:0',

    gcodeFilename:     'regex:/^[^;,\*]+$/',
    gcodeExtension:    'regex:/^[^;,\*\/]+$/',
    workspaceFilename: 'regex:/^[^;,\*]+$/'
}


export function ValidateSettings(bool = true, rules = SETTINGS_VALIDATION_RULES, settings = null) {

    if (!settings)
        settings = Object.assign({}, GlobalStore().getState().settings)

    let check = new Validator(settings, rules);

    if (bool)
        return check.passes();

    return check;
}

export const SETTINGS_INITIALSTATE = {

    __version: version,
    __selectedProfile: null,
    __latestRelease: null,

    firmwareURL: null,
    firmwareLogo: null,

    showMachine: true,
    workBedColor: "#f4fafa",
    workSpaceColor: "#eaeaf8",

    machineWidth: 300,
    machineHeight: 200,
    machineBeamDiameter: 0.2,
    machineBurnWhite: false,
    machineBottomLeftX: 0,
    machineBottomLeftY: 0,

    machineFeedRange: {
        XY: {min: 1, max:50000},
        Z: {min: 1, max:50000},
        A: {min: 1, max:50000},
        S: {min: 0, max:30000},
    },

    machineXYProbeOffset: 0,

    machineZEnabled: false,
    machineMillEnabled: false,
    machineZToolOffset: 0,
    machineZStartHeight: 0,
    machineRapidZ: 2,
    machineZProbeOffset: 0,

    machineAEnabled: false,
    machineAAxisDiameter: 10,

    machineBlowerEnabled: false,
    machineBlowerGcodeOn: '',
    machineBlowerGcodeOff: '',
    machineFluidEnabled: false,
    machineFluidGcodeOn: '',
    machineFluidGcodeOff: '',

    pxPerInch: 96,
    forcePxPerInch: false,
    dpiBitmap: 300,
    svgPrecision: 4,
    svgStrokeColor: "#c0c0c0",
    svgFillOpacity: "100",
    gcodeFilename: "gcode-%y%m%d-%H%M",
    gcodeExtension: ".gcode",
    workspaceFilename: "Laserweb-Workspace-%y%m%d-%H%M",

    simG0Rate: 1000,
    simBarWidth: 22,

    toolGridWidth: 500,
    toolGridHeight: 500,
    toolGridMinorSpacing: 10,
    toolGridMajorSpacing: 50,
    toolGridXColor: "#d72828",
    toolGridYColor: "#28d728",
    toolImagePosition: "BL",
    toolUseNumpad: false,
    toolDisplayCache: false,
    toolUseGamepad: false,
    toolCreateEmptyOps: false,

    toolVideoDevice: null,
    toolVideoPerspective: { enabled: false },
    toolVideoLens: { a: 1, b: 1, F: 1, scale: 1 },
    toolVideoFov: { x: 1, y: 1 },
    toolVideoResolution: "720p(HD)",

    toolVideoOMR: false,
    toolVideoOMROffsetX: 0,
    toolVideoOMROffsetY: 0,
    toolVideoOMRMarkerSize: 20,

    toolWebcamUrl: "",
    toolFeedUnits: 'mm/min',

    gcodeStart: "G21         ; Set units to mm\r\nG90         ; Absolute positioning\r\n",
    gcodeMillStart: "",
    gcodeEnd: "M5          ; Switch tool off\r\n",
    gcodeMillEnd: "",
    gcodeHoming: "",
    gcodeGenerator: "default",
    gcodeToolOn: "",
    gcodeToolOff: "",
    gcodeLaserIntensity: 'S',
    gcodeLaserIntensitySeparateLine: false,
    gcodeSMinValue: 0,
    gcodeSMaxValue: 1,
    gcodeCheckSizePower: 0,
    gcodeToolTestPower: 0,
    gcodeToolTestDuration: 0,
    gcodeConcurrency: 2,
    gcodeSegmentLength: 0,
    gcodeCurvePrecision: 0.1,

    comServerVersion: 'not connected',
    comApiVersion: 'N/A',
    comServerIP: 'localhost:8000',
    comServerConnect: false,
    comInterfaces: [],
    comPorts: [],
    comAccumulatedJobTime: 0,

    connectVia: '',
    connectPort: '',
    connectBaud: '115200',
    connectIP: '',
    connectReset: 'default',

    jogStepsize: 1,
    jogFeedXY: 1800,
    jogFeedZ: 300,

    macros: MACROS_INITIALSTATE,

    uiFcDrag: null,
}

export const settings = (state, action) => {
    state = objectNoId('settings', SETTINGS_INITIALSTATE)(state, action);
    Object.assign(state, { macros: macros(state.macros||{}, action)});
    switch (action.type) {
        case actionTypes.INIT:
            state = Object.assign({}, state, { __version: version })
            break;
    }
    return state;
}
