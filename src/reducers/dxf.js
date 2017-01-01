"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';

import { elementToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'

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

var LayerLookup = new Map();

export function processDXF(state, docFile, dxfTree) {
    LayerLookup = new Map(); // wipe layer ID on new file load
    let i, entity;
    var fileLayers = [];

    let docLayer = {
        ...initialDocument,
        type: 'LAYER',
        isRoot: false,
        children: [],
    }

    for (i = 0; i < dxfTree.entities.length; i++) {
        entity = dxfTree.entities[i];
        if (entity.type === 'DIMENSION') {
            console.log('WARNING: No block for DIMENSION entity');
        } else {
            // ID layers
            if (!LayerLookup.has(entity.layer)) { // Does layer exist?
                LayerLookup.set(entity.layer, uuid.v4()) // Create an ID for it
                docLayer.id = LayerLookup.get(entity.layer);
                docLayer.name = 'LAYER: ' + entity.layer;
                state.push(docLayer);
                docFile.children.push(docLayer.id); // register layer under file
                drawEntity(state, entity, dxfTree, docLayer, i);
            } else {
                drawEntity(state, entity, dxfTree, docLayer, i);
            }
            //drawEntity(entity, dxfTree, doc, i);
        }
    }
    //fileLayers = [ ...new Set(fileLayers) ]; // list of unique layer names
}

function drawEntity(state, entity, dxfTree, docLayer, index) {
    //console.log('inside drawEntity:  Entity ', entity, '  Index: ', index)
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
        drawCircle(entity, index);
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'LINE' || entity.type === 'POLYLINE') {
        drawLine(state, entity, index, docLayer);
    } else if (entity.type === 'TEXT') {
        drawText(entity, index);
    } else if (entity.type === 'SOLID') {
        drawSolid(entity, index);
    } else if (entity.type === 'POINT') {
        drawPoint(entity, index);
    }
}

function drawLine(state, entity, index, docLayer) {
    let docEntity = {
        ...initialDocument,
        id: uuid.v4(),
        type: entity.type,
        name: entity.layer + ': ' + entity.type + ': ' + entity.handle,
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

    state.push(docEntity);
    docLayer.children.push(docEntity.id); // register feature under layer
}
