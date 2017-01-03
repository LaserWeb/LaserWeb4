"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';

import { elementToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'
import { documents } from '../reducers/document'
import { addDocumentChild } from '../actions/document'

export function processDXF(state, docFile, dxfTree) {
    var LayerLookup = new Map();
    let i, entity;
    let docLayer = {};

    for (i = 0; i < dxfTree.entities.length; i++) {
        entity = dxfTree.entities[i];
        if (entity.layer) {
            if (!LayerLookup.has(entity.layer)) {
                // Does layer exist?, if not then proceed
                LayerLookup.set(entity.layer, uuid.v4())
                docLayer.id = LayerLookup.get(entity.layer);
                docLayer.name = 'LAYER: ' + entity.layer;
                docLayer.type = 'LAYER';
                state = documents(state, addDocumentChild(docFile.id, docLayer));
                state = drawEntity(state, entity, docLayer, i);
            } else {
                // Layer already listed
                state = drawEntity(state, entity, docLayer, i);
            }
        } else {
            // Entity in not in any layer, child of docFile
            state = drawEntity(state, entity, docFile, i);
        }
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
    } else if (entity.type === 'DIMENSION') {
        state = drawDimension(state, entity, docLayer, index);
    }
    return state;
}

function angle2 (p1, p2) {
    p2.sub(p1); // sets v2 to be our chord
    p2.normalize(); // normalize because cos(theta) =
    // if(v2.y < 0) return Math.PI + (Math.PI - Math.acos(v2.x));
    if(p2[1] < 0) return -Math.acos(p2[0]);
    return Math.acos(p2[0]);
}

function polar (point, distance, angle) {
    var result = [];
    result[0] = point[0] + distance * Math.cos(angle);
    result[1] = point[1] + distance * Math.sin(angle);
    return result;
}

function drawLine(state, entity, docLayer, index) {
    let docEntity = {
        type: entity.type,
        name: entity.type + ': ' + entity.handle,
    }

    let rawPaths = [];
    let p = [];
    let startPoint, endPoint, bulgeGeometry, bulge;

    for (let i = 0; i < entity.vertices.length; i++) {
        if (entity.vertices[i].bulge) {
            console.log("BULGE: " + entity);
            bulge = entity.vertices[i].bulge;
            startPoint = entity.vertices[i];
            endPoint = i + 1 < entity.vertices.length ? entity.vertices[i + 1] : {}; // no endpoint of bulge!

            let vertex, i, center, p0, p1, angle, radius, startAngle, thetaAngle, dist, segments;

            startPoint = p0 = [startPoint.x, startPoint.y] || [0,0];
            endPoint = p1 = [endPoint.x, endPoint.y] || [1,0];
            bulge = bulge || 1;

            angle = 4 * Math.atan(bulge);
            dist = Math.sqrt( (p0[0]-p0[1])*(p0[0]-p0[1]) + (p1[0]-p1[1])*(p1[0]-p1[1]) );

            radius = dist / 2 / Math.sin(angle/2);
            center = polar(startPoint, radius, angle2(p0,p1) + (Math.PI / 2 - angle/2));

            segments = segments || Math.max( Math.abs(Math.ceil(angle/(Math.PI/18))), 6); // By default want a segment roughly every 10 degrees
            startAngle = angle2(center, p0);
            thetaAngle = angle / segments;

            p.push(p0[0], p0[1]); // starting point
            for(i = 1; i <= segments - 1; i++) {
                let coords = polar(center, Math.abs(radius), startAngle + thetaAngle * i);
                p.push(coords[0], coords[1]);
            }
        } else {
            let vertex = {};
            vertex = entity.vertices[i];
            p.push(vertex.x, vertex.y);
        }
    }

    if (p.length)
        rawPaths = rawPaths.concat(p);
    if (entity.shape) {
        rawPaths = rawPaths.concat(entity.vertices[0].x, entity.vertices[0].y); // To close off the shape
    }
    if (rawPaths.length) {
        docEntity.rawPaths = [];
        docEntity.rawPaths[0] = rawPaths;
        docEntity.translate = [0, 0, 0];
        docEntity.scale = [1, 1, 1];
        docEntity.strokeColor = idxToRGBColor(entity.color);
        if (entity.shape)
            docEntity.fillColor = [0, 0, 0, 0.3]; // Shade in to show its a closed shape
        else
            docEntity.fillColor = [0, 0, 0, 0];
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function drawCircle(state, entity, docLayer, index) {
    let radius = entity.radius;
    let arcTotalDeg = entity.startAngle - entity.endAngle;
    let segments = 128;
    let thetaStart = entity.startAngle !== undefined ? entity.startAngle : 0;
    let thetaLength = entity.angleLength !== undefined ? entity.angleLength : Math.PI * 2;
    let vertices = segments + 2;

    let docEntity = {
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

    // Close off the shape if not an ARC
    if (!arcTotalDeg) {
        p.push( p[0] );
        p.push( p[1] );
    }

    let rawPaths = [];
    if (p.length)
        rawPaths = rawPaths.concat(p);
    if (rawPaths.length) {
        docEntity.rawPaths = [];
        docEntity.rawPaths[0] = rawPaths;
        docEntity.translate = [0, 0, 0];
        docEntity.scale = [1, 1, 1];
        docEntity.strokeColor = idxToRGBColor(entity.color);
        if (!arcTotalDeg)
            docEntity.fillColor = [0, 0, 0, 0.3];  // Shade in to show its a closed shape
        else
            docEntity.fillColor = [0, 0, 0, 0];
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function drawText(state, entity, docLayer, index) {
    console.log("TEXT: " + entity);
    //TODO
    return state;
}

function drawDimension(state, entity, docLayer, index) {
    console.log("DIMENSION: " + entity);
    //TODO
    return state;
}

function drawSolid(state, entity, docLayer, index) {
    console.log("SOLID: " + entity);
    //TODO
    return state;
}

function drawPoint(state, entity, docLayer, index) {
    // TODO: Currently points are mutated into circles with a
    entity.radius = 0.1;
    let x = entity.position.x;
    let y = entity.position.y;
    entity.center = { x, y };

    let temp = drawCircle(state, entity, docLayer, index);
    let docEntity = temp.slice(-1);
    docEntity = docEntity[0];

    docEntity.fillColor = [0, 0, 0, 1];

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function idxToRGBColor(index) {
    if (index) {
	    let r = (index >> 16) & 0xFF;
	    let g = (index >> 8) & 0xFF;
	    let b = index & 0xFF;
        let a = 1;
        return [r, g, b, a];
    } else
	   return [0, 0, 0, 1];
}
