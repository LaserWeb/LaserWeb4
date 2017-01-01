"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';

import { elementToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'
import { documents } from '../reducers/document'
import { addDocumentChild } from '../actions/document'

const initialDocument = {
    id: '',
    type: '?',
    name: '',
    mimeType: '',
    isRoot: false,
    children: [],
    selected: false,
    translate: null,
    scale: null,
    rawPaths: null,
    strokeColor: null,
    fillColor: null,
    dataURL: '',
    dpi: 1,
};

export function processDXF(state, docFile, dxfTree) {
    var LayerLookup = new Map();
    let i, entity;
    let docLayer = {};

    for (i = 0; i < dxfTree.entities.length; i++) {
        entity = dxfTree.entities[i];
        if (entity.type === 'DIMENSION') {
            console.log('WARNING: No block for DIMENSION entity');
        } else {
            if (!LayerLookup.has(entity.layer)) { // Does layer exist, if not then proceed
                LayerLookup.set(entity.layer, uuid.v4()) // Create an ID for it
                docLayer.id = LayerLookup.get(entity.layer);
                docLayer.name = 'LAYER: ' + entity.layer;
                docLayer.type = 'LAYER';
                state = documents(state, addDocumentChild(docFile.id, docLayer));
                state = drawEntity(state, entity, docLayer, i);
            } else {
                state = drawEntity(state, entity, docLayer, i);
            }
        }
        console.log('WARNING: entity not in a layer:', entity);
    }
    return state;
}

function drawEntity(state, entity, docLayer, index) {
    //console.log('inside drawEntity:  Entity ', entity, '  Index: ', index)
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
        state = drawCircle(state, entity, docLayer, index);
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'LINE' || entity.type === 'POLYLINE') {
        state = drawLine(state, entity, docLayer, index);
    } else if (entity.type === 'TEXT') {
        state = drawText(state, entity, docLayer, index);
    } else if (entity.type === 'SOLID') {
        state = drawSolid(state, entity, docLayer, index);
    } else if (entity.type === 'POINT') {
        state = drawPoint(state, entity, docLayer, index);
    }
    return state;
}

function drawLine(state, entity, docLayer, index) {
    let docEntity = {
        ...initialDocument,
        id: uuid.v4(),
        type: entity.type,
        name: entity.type + ': ' + entity.handle,
        isRoot: false,
        children: [],
        selected: false,
    }

    // create geometry
    let rawPaths = [];
    for (let j = 0; j < entity.vertices.length; j++) {
        let p = [];
        let vertex = {};
        vertex = entity.vertices[j];
        p.push(vertex.x, vertex.y);
        if (p.length)
        rawPaths = rawPaths.concat(p);
    }
    if (entity.shape) {
        rawPaths = rawPaths.concat(entity.vertices[0].x, entity.vertices[0].y); // To close off the shape
    }

    if (rawPaths.length) {
        docEntity.rawPaths = [];
        docEntity.rawPaths[0] = rawPaths;
        docEntity.translate = [0, 0, 0];
        docEntity.scale = [1, 1, 1];
        docEntity.strokeColor = [0, 0, 0, 1];
        docEntity.fillColor = [0, 0, 0, 0];
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function drawCircle(state, entity, docLayer, index) {
    let radius = entity.radius;
    let arcTotalDeg = entity.startAngleDeg - entity.endAngleDeg;
    let segments = 128;
    let thetaStart = entity.startAngle !== undefined ? entity.startAngle : 0;
    let thetaLength = entity.angleLength !== undefined ? entity.angleLength : Math.PI * 2;
    let vertices = segments + 2;

    let docEntity = {
        ///id: uuid.v4(),
        type: entity.type,
        name: entity.type + ': ' + entity.handle,
    }

    /**
    theta can be calculated as 2*pi radians divided by the number of points.
    The first point is at theta*0 with respect to the x axis,
    the second point at angle theta*1, the third point at angle theta*2, etc.

    Using simple trigonometry, you can find the X and Y coordinates of any point
    that lies on the edge of a circle.

    xFromCenter = r*cos(ohm)
    yFromCenter = r*sin(ohm)
    **/

    let p = [];
    let theta = 2 * Math.PI / vertices;
    for (let i = 0; i < vertices; i++) {
        let segment = thetaStart + i / vertices * thetaLength;
        let dx = radius * Math.cos(segment);
        let dy = radius * Math.sin(segment);
        p.push(entity.center.x + dx);
        p.push(entity.center.y + dy);
    }

    let rawPaths = [];
    if (p.length)
        rawPaths = rawPaths.concat(p);
    if (rawPaths.length) {
        docEntity.rawPaths = [];
        docEntity.rawPaths[0] = rawPaths;
        docEntity.translate = [0, 0, 0];
        docEntity.scale = [1, 1, 1];
        docEntity.strokeColor = [0, 0, 0, 1];
        docEntity.fillColor = [0, 0, 0, 0];
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function drawText(state, entity, docLayer, index) {
    //TODO
    return state;
}

function drawSolid(state, entity, docLayer, index) {
    //TODO
    return state;
}

function drawPoint(state, entity, docLayer, index) {
    //TODO
    return state;
}
