// Copyright (c) 2016 Trevor Johansen Aase
//
// The MIT License (MIT)
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// Ideas, inspiration, and code reworked from the following projects:
// THREE.js, Opentype,js, lw.svg-parser

"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';
import opentype from 'opentype.js';

import { elementToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'
import { documents } from '../reducers/document'
import { addDocumentChild } from '../actions/document'

// WARNING: async calls in this function!
export function extractTEXT(dxfTree) {
    let svgHeader = '';
    let svgText = '<?xml version="1.0" encoding="utf-8"?><!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"	 viewBox="0 0 300 300" style="enable-background:new 0 0 841.9 595.3;" xml:space="preserve"><path d="M22.96-10L22.96-41.57L11.17-41.57L11.17-45.79L39.54-45.79L39.54-41.57L27.70-41.57L27.70-10L22.96-10ZM56.04-18.35L60.59-17.79Q59.51-13.81 56.61-11.61Q53.70-9.41 49.18-9.41Q43.50-9.41 40.16-12.92Q36.83-16.42 36.83-22.74Q36.83-29.29 40.20-32.90Q43.57-36.51 48.94-36.51Q54.14-36.51 57.44-32.97Q60.73-29.43 60.73-23.01Q60.73-22.62 60.71-21.84L41.37-21.84Q41.62-17.57 43.79-15.30Q45.96-13.03 49.21-13.03Q51.63-13.03 53.33-14.30Q55.04-15.57 56.04-18.35M41.62-25.45L56.09-25.45Q55.80-28.73 54.43-30.36Q52.33-32.90 48.99-32.90Q45.96-32.90 43.90-30.87Q41.84-28.85 41.62-25.45ZM64.35-17.74L68.69-18.42Q69.06-15.81 70.73-14.42Q72.40-13.03 75.41-13.03Q78.43-13.03 79.90-14.26Q81.36-15.49 81.36-17.15Q81.36-18.64 80.07-19.50Q79.17-20.08 75.58-20.99Q70.74-22.21 68.87-23.10Q67.01-23.99 66.04-25.56Q65.08-27.14 65.08-29.04Q65.08-30.78 65.87-32.25Q66.67-33.73 68.03-34.71Q69.06-35.46 70.83-35.99Q72.60-36.51 74.62-36.51Q77.68-36.51 79.98-35.63Q82.29-34.76 83.39-33.25Q84.49-31.75 84.90-29.24L80.61-28.65Q80.31-30.65 78.91-31.78Q77.50-32.90 74.94-32.90Q71.91-32.90 70.62-31.90Q69.33-30.90 69.33-29.56Q69.33-28.70 69.86-28.02Q70.40-27.31 71.55-26.85Q72.21-26.60 75.43-25.72Q80.09-24.48 81.94-23.68Q83.78-22.89 84.83-21.38Q85.88-19.86 85.88-17.62Q85.88-15.42 84.60-13.48Q83.32-11.54 80.90-10.48Q78.48-9.41 75.43-9.41Q70.38-9.41 67.73-11.51Q65.08-13.61 64.35-17.74ZM100.70-13.93L101.33-10.05Q99.48-9.66 98.01-9.66Q95.62-9.66 94.30-10.42Q92.98-11.17 92.45-12.40Q91.91-13.64 91.91-17.59L91.91-32.51L88.69-32.51L88.69-35.93L91.91-35.93L91.91-42.35L96.28-44.99L96.28-35.93L100.70-35.93L100.70-32.51L96.28-32.51L96.28-17.35Q96.28-15.47 96.51-14.93Q96.74-14.39 97.27-14.08Q97.79-13.76 98.77-13.76Q99.50-13.76 100.70-13.93ZM117.18-20.74L117.18-25.16L130.68-25.16L130.68-20.74L117.18-20.74ZM151.77-18.89L150.43-37.86L150.43-45.79L155.87-45.79L155.87-37.86L154.60-18.89L151.77-18.89M150.63-10L150.63-15.00L155.68-15.00L155.68-10L150.63-10Z"/></svg>';

    opentype.load('./fonts/Arial.ttf', function(err, font) {
        if (err) {
            alert('Could not load font: ' + err + '\n\nMake sure the font is in the ./dist/fonts/ folder');
        } else {
            font.getPath();
        }
    });
    return svgText;
}

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

function angle2 (p1, p2) { // [x,y] arrays
    let v1 = [0, 0];
    let v2 = [ p2[0] - p1[0], p2[1] - p1[1] ]; // sets v2 to be our chord
    //let hyp = Math.sqrt( (p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]) );
    let hyp = Math.sqrt( (v2[0]*v2[0])+(v2[1]*v2[1]) );
    let norm = [ v2[0] / hyp, v2[1] / hyp ]; // normalize because cos(theta) =
    // if(v2.y < 0) return Math.PI + (Math.PI - Math.acos(v2.x));
    if(norm[1] < 0)
        return -Math.acos(norm[0]);
    return Math.acos(norm[0]);
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
            let vertex, center, p0, p1, angle, radius, startAngle, thetaAngle, dist, segments;

            bulge = entity.vertices[i].bulge;
            startPoint = entity.vertices[i];
            endPoint = i + 1 < entity.vertices.length ? entity.vertices[i + 1] : { x: p[0], y: p[1] }; // no endpoint of bulge!

            startPoint = p0 = [startPoint.x, startPoint.y] || [0,0];
            endPoint = p1 = [endPoint.x, endPoint.y] || [1,0];
            bulge = bulge || 1;

            angle = 4 * Math.atan(bulge);
            dist = Math.sqrt( (p0[0]-p1[0])*(p0[0]-p1[0]) + (p0[1]-p1[1])*(p0[1]-p1[1]) );
            radius = dist / 2 / Math.sin(angle/2);
            center = polar(startPoint, radius, angle2(p0,p1) + (Math.PI / 2 - angle/2));

            segments = segments || Math.max( Math.abs(Math.ceil(angle/(Math.PI/18))), 6); // By default want a segment roughly every 10 degrees
            startAngle = angle2(center, p0);
            thetaAngle = angle / segments;

            p.push(p0[0], p0[1]); // starting point
            for(let j = 1; j <= segments; j++) { //for(let j = 1; j <= segments - 1; j++) {
                let coords = polar(center, Math.abs(radius), startAngle + thetaAngle * j);
                p.push(coords[0], coords[1]);
            }
            //p.push(p0[0], p0[1]); // close off the shape
            console.log(entity, p);
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
