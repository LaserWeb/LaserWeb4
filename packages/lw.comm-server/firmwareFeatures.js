"use strict";
var exports = module.exports = {};

var featuresGrbl = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: false,
    feedOverride: true,
    spindleOverride: true,
    dynamicPwmM4: true,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: true
};

var featuresSmoothie = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: true,
    spindleOverride: true,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: true
};

var featuresTinyG = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: false,
    spindleOverride: false,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: false
};

var featuresRepetier = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: false,
    spindleOverride: false,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: false
};

var featuresMarlinkimbra = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: false,
    spindleOverride: false,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: false
};

var featuresMarlin = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: false,
    spindleOverride: false,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: false
};

var featuresRepRapFirmware = {
    pause: true,
    resume: true,
    stop: true,
    reset: true,
    home: true,
    disableMotors: true,
    feedOverride: true,
    spindleOverride: true,
    dynamicPwmM4: false,
    xAxes: true,
    yAxes: true,
    zAxes: true,
    aAxes: false
};

var featuresNone = {
    pause: false,
    resume: false,
    stop: false,
    reset: false,
    home: false,
    disableMotors: false,
    feedOverride: false,
    spindleOverride: false,
    dynamicPwmM4: false,
    xAxes: false,
    yAxes: false,
    zAxes: false,
    aAxes: false
};

exports.get = function (firmware) {
    switch (firmware) {
        case 'grbl':
            return featuresGrbl;
        case 'smoothie':
            return featuresSmoothie;
        case 'tinyg':
            return featuresTyinG;
        case 'repetier':
            return featuresRepetier;
        case 'marlinkimbra':
            return featuresMarlinkimbra;
        case 'marlin':
            return featuresMarlin;
        case 'reprapfirmware':
            return featuresRepRapFirmware;
        default:
            return featuresNone;
    }
};
