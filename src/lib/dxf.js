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

import uuidv4 from 'uuid/v4';
import vectorizeText from 'vectorize-text';

import { documents } from '../reducers/document'
import { addDocumentChild } from '../actions/document'

import { confirm, prompt, alert } from '../components/laserweb'

const debugShape = [0, 0, 0, 0];

export function processDXF(state, docFile, dxfTree) {
    var LayerLookup = new Map();
    let i, polyline;
    let docLayer = {};

    for (i = 0; i < dxfTree.polylines.length; i++) {
        polyline = dxfTree.polylines[i];
        // the DXF parser does not return layer info, just colors.
        // Layers are not really used in commercial dxf's.
        // Instead 'layer' the imported paths by color
        let layerID = byteToHex(polyline.rgb[0]) + byteToHex(polyline.rgb[1]) + byteToHex(polyline.rgb[2]);

        if (!LayerLookup.has(layerID)) {
            // console.log("New layer: " + layerID)
            docLayer = {};
            LayerLookup.set(layerID, uuidv4())
            docLayer.id = LayerLookup.get(layerID);
            docLayer.name = 'Color: #' + layerID;
            docLayer.type = 'LAYER';
            docLayer.color = (polyline.rgb[2]*65536)+(polyline.rgb[2]*256)+polyline.rgb[0];

            state = documents(state, addDocumentChild(docFile.id, docLayer));
            state = drawPolyLine(state, polyline, docLayer, i);
        } else {
            // RGB Layer already listed, set docLayer and add polyline
            docLayer = state.find((element) => (element.id === LayerLookup.get(layerID)))
            state = drawPolyLine(state, polyline, docLayer, i)
        }
    }
    return state;
}

function drawPolyLine(state, polyline, docLayer, index) {
    // console.log('drawPolyLine:  PolyLine ', polyline, '  Index: ', index)
    let docEntity = {
        type: 'PATH',
        name: 'path: ' + index,
    }

    let rawPaths = [];
    let p = [];

    for (let i = 0; i < polyline.vertices.length; i++) {
            let vertex = {};
            vertex = polyline.vertices[i];
            p.push(vertex[0], vertex[1]);    // [0]=X, [1]=Y
    }

    if (p.length)
        rawPaths = rawPaths.concat(p);

    if (rawPaths.length) {
        polyline.rgb[3] = 1; // add alpha channel to rgb value returned by dxf parser
        // Force white lines (a common default for dxf's) to become black
        if ((polyline.rgb[0] == 255) && (polyline.rgb[1] == 255) && (polyline.rgb[2] == 255)) polyline.rgb = [0,0,0,1]
        docEntity.rawPaths = [];
        docEntity.rawPaths[0] = rawPaths;
        docEntity.transform2d = [1, 0, 0, 1, 0, 0];
        docEntity.strokeColor = polyline.rgb;
        docEntity.fillColor = [0, 0, 0, 0];
        state = documents(state, addDocumentChild(docLayer.id, docEntity));
    }
    return state;
}

function byteToHex(byte) {
  var hex = Number(byte).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};
