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

import uuid from 'node-uuid';
import vectorizeText from 'vectorize-text';

import { documents } from '../reducers/document'
import { addDocumentChild } from '../actions/document'

import { alert } from '../components/laserweb'

const debugShape = [0, 0, 0, 0];

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

                try {
                  let layers = dxfTree.tables.layer.layers;
                  for (var prop in layers) {
                      if (layers[prop].name == entity.layer)
                          if(layers[prop].color)
                                docLayer.color = layers[prop].color;
                  }
                } catch(e) {
                  docLayer.color = 0;
                }

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
    } else if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
        state = drawText(state, entity, docLayer, index);
    } else if (entity.type === 'SOLID') {
        state = drawSolid(state, entity, docLayer, index);
    } else if (entity.type === 'POINT') {
        state = drawPoint(state, entity, docLayer, index);
    } else if (entity.type === 'DIMENSION') {
        state = drawDimension(state, entity, docLayer, index);
    } else {
      alert('Unsupported entity type:'+action.payload.file.type)
      console.error('Unsupported entity type:', action.payload.file.type)
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
        if (entity.color)
            docEntity.strokeColor = idxToRGBColor(entity.color);
        else
            docEntity.strokeColor = idxToRGBColor(docLayer.color);
        if (entity.shape)
            docEntity.fillColor = debugShape; // Shade in to show its a closed shape
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
        if (entity.color)
            docEntity.strokeColor = idxToRGBColor(entity.color);
        else
            docEntity.strokeColor = idxToRGBColor(docLayer.color);
        if (!arcTotalDeg)
            docEntity.fillColor = debugShape;  // Shade in to show its a closed shape
        else
            docEntity.fillColor = [0, 0, 0, 0];
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
    return state;
}

function drawText(state, entity, docLayer, index) {
    let docEntity = {
        type: entity.type,
        name: entity.type + ': ' + entity.handle,
    }

    // Create default font settings
    entity = {
        ...entity,
        fontStyle: entity.fontStyle || 'normal', // normal italic oblique
        fontWeight: entity.fontWeight || 'normal', // normal bold
        fontFamily: entity.fontFamily || 'Arial',
    }

    if (entity.type == "MTEXT") {
        let regex = /\{\\f(.*?)\|(\w+)\|(\w+)\|(\w+)\|(\w+)\;(.*?)\}$/g;
        let regexString = regex.exec(entity.text); // 0: origStrng, 1: font, 2: bold, 3: italics, 6: text
        if (regexString) {
            let style, weight;
            if (regexString[2] == 'b1')
                entity.fontWeight = 'bold';
            if (regexString[3] == 'i1')
                entity.fontWeight = 'italic';
            if (regexString[1])
                entity.fontFamily = regexString[1];
            if (regexString[6])
                entity.text = regexString[6];
        } else {
            regex = /\{(.*?)\}$/g;
            regexString = regex.exec(entity.text);
            if (regexString) {
                entity.text = regexString[1];
            }
        }

        entity = {
            ...entity,
            startPoint: {
                x: entity.position.x,
                y: entity.position.y
            },
            textHeight: entity.height,
        }
    }

    // Translate text to proper baseline
    var cvs = document.createElement('canvas');
    cvs.setAttribute('zoom', 'reset');
    var ctx = cvs.getContext('2d');
    ctx.font = `${entity.textHeight}mm sans-serif` // ctx rounds to whole px's so div10
    var ppmm = /[0-9.]*/.exec(ctx.font)
    var ppmmTrans = ppmm/2 - entity.textHeight/2

    var polygons = vectorizeText(entity.text, {
      height: entity.textHeight,
      fontStyle: entity.fontStyle,
      fontWeight: entity.fontWeight,
      font: entity.fontFamily,
      polygons: true,
    });
    console.log(`polygons: ${polygons}`);

    let coords = [];
    polygons.forEach(function(loops) {
      loops.forEach(function(loop) {
        let points = [];
        var start = loop[0]
        points.push(start[0],-start[1]) // origin x,y
        for(var i=1; i<loop.length; ++i) {
          var p = loop[i]
          points.push(p[0],-p[1]) // character lines
        }
        points.push(start[0],-start[1]) // line back to origin
        coords.push(points);
      })
  });

    if (coords.length) {
        docEntity.rawPaths = coords;
        docEntity.translate = [entity.startPoint.x, entity.startPoint.y - ppmmTrans, 0];
        docEntity.scale = [1, 1, 1]; //14
        if (entity.color)
            docEntity.strokeColor = idxToRGBColor(entity.color);
        else
            docEntity.strokeColor = idxToRGBColor(docLayer.color);
        docEntity.fillColor = docEntity.strokeColor;
    }

    state = documents(state, addDocumentChild(docLayer.id, docEntity));
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
let y = 0;
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
    if (index == 16777215) // Force white lines to become black
        return [0, 0, 0, 1];
    else if (index) {
        let r = (index >> 16) & 0xFF;
        let g = (index >> 8) & 0xFF;
        let b = index & 0xFF;
        let a = 1;
        return [r, g, b, a];
    } else
        return [0, 0, 0, 1];
}
