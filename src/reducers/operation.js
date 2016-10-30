"use strict";

import { object, objectArray } from '../reducers/object'

export const operation = object('operation', {
    documents: [],
    expanded: false,
    type: 'Laser Engrave',
    direction: 'Conventional',
    laserPower: 100,
    laserDiameter: 6.35,
    toolDiameter: 6.35,
    margin: 0,
    cutWidth: 0,
    stepOver: 0.4,
    passDepth: 0,
    cutDepth: 0,
    plungeRate: 0,
    cutRate: 0,
});

export const operations = objectArray('operation', operation);
