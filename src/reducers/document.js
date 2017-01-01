"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';
import Snap from 'snapsvg-cjs';

import { forest, getSubtreeIds, object, reduceParents, reduceSubtree } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'
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

const documentBase = object('document', initialDocument);

export function document(state, action) {
    switch (action.type) {
        case 'DOCUMENT_TRANSLATE_SELECTED':
            if (state.selected && state.translate) {
                return { ...state, translate: vec3.add([], state.translate, action.payload) };
            } else
                return state;
        case 'DOCUMENT_SCALE_TRANSLATE_SELECTED':
            if (state.selected && state.scale && state.translate) {
                return {
                    ...state,
                    scale: vec3.mul([], state.scale, action.payload.scale),
                    translate: vec3.add([], vec3.mul([], action.payload.scale, state.translate), action.payload.translate),
                };
            } else
                return state;
        default:
            return documentBase(state, action)
    }
}

const documentsForest = forest('document', document);

function loadSvg(state, settings, {file, content}) {
    let {parser, tags} = content;
    state = state.slice();
    let pxPerInch = +settings.pxPerInch || 96;
    let allPositions = [];

    function getColor(c) {
        let sc = Snap.color(c);
        if (sc.r === -1 || sc.g === -1 || sc.b === -1)
            return [0, 0, 0, 0];
        else
            return [sc.r / 255, sc.g / 255, sc.b / 255, 1];
    }

    function addChildren(parent, tag) {
        for (let child of tag.children) {
            let c = {
                ...initialDocument,
                id: uuid.v4(),
                type: child.name,
                name: child.name + ': ' + child.attrs.id,
                isRoot: false,
                children: [],
                selected: false,
            };
            let rawPaths = [];
            for (let path of child.getPaths()) {
                let p = [];
                for (let point of path.points)
                    p.push(point.x / pxPerInch * 25.4, point.y / pxPerInch * 25.4);
                if (p.length)
                    rawPaths.push(p);
            }
            if (rawPaths.length) {
                allPositions.push(rawPaths);
                c.rawPaths = rawPaths;
                c.translate = [0, 0, 0];
                c.scale = [1, 1, 1];
                c.strokeColor = getColor(child.attrs.stroke);
                c.fillColor = getColor(child.attrs.fill);
                if (hasClosedRawPaths(rawPaths)) {
                    if (!c.fillColor[3] && !c.strokeColor[3])
                        c.fillColor[3] = .3;
                } else if (!c.strokeColor[3])
                    c.strokeColor[3] = .3;
            } else if (child.name === 'image') {
                let element = child.element;
                let mat = Snap(element).transform().globalMatrix;
                let dataURL = element.getAttribute('xlink:href');
                if (dataURL.substring(0, 5) !== 'data:')
                    continue;
                let i = new Image;
                i.src = dataURL;
                let rawX = element.x.baseVal.value;
                let rawY = element.y.baseVal.value;
                let rawW = element.width.baseVal.value;
                let rawH = element.height.baseVal.value;
                let x = (mat.x(rawX, rawY) + parser.document.viewBox.x) / pxPerInch * 25.4;
                let y = (mat.y(rawX, rawY) + parser.document.viewBox.y) / pxPerInch * 25.4;
                let w = (mat.x(rawX + rawW, rawY + rawH) + parser.document.viewBox.x) / pxPerInch * 25.4 - x;
                let h = (mat.y(rawX + rawW, rawY + rawH) + parser.document.viewBox.y) / pxPerInch * 25.4 - y;
                c = {
                    ...c,
                    translate: [x, parser.document.viewBox.height / pxPerInch * 25.4 - y - h, 0],
                    scale: [w / i.width, h / i.height, 1],
                    mimeType: file.type,
                    dataURL: dataURL,
                    dpi: 25.4,
                };
            }
            state.push(c);
            parent.children.push(c.id);
            addChildren(c, child)
        }
    }

    let doc = {
        ...initialDocument,
        id: uuid.v4(),
        type: 'document',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
    };
    state.push(doc);
    addChildren(doc, tags);
    flipY(allPositions, parser.document.viewBox.height / pxPerInch * 25.4);
    return state;
}

function loadImage(state, {file, content}) {
    state = state.slice();
    let doc = {
        ...initialDocument,
        id: uuid.v4(),
        type: 'image',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
        translate: [0, 0, 0],
        scale: [1, 1, 1],
        mimeType: file.type,
        dataURL: content,
        dpi: 96, // TODO
    };
    state.push(doc);
    return state;
}

// TODO: take out of global scope somehow
var LayerLookup = new Map();

function loadDxf(state, settings, {file, content}) {
  state = state.slice();
  LayerLookup = new Map();

  let docFile = {
      ...initialDocument,
      id: uuid.v4(),
      type: 'document',
      name: file.name,
      isRoot: true,
      children: [],
      selected: false,
  };
  state.push(docFile); // state[0] is the file root structure
  processDXF(docFile, content);

  function processDXF(docFile, dxfTree) {
    let i, entity;
    let newLayer = false;
    var fileLayers = [];

    let docLayer = {
        ...initialDocument,
        type: 'LAYER',
        isRoot: false,
        children: [],
    }

    for(i = 0; i < dxfTree.entities.length; i++) {
      entity = dxfTree.entities[i];
      if(entity.type === 'DIMENSION') {
        console.log('WARNING: No block for DIMENSION entity');
      } else {
        // ID layers
        if (!LayerLookup.get(entity.layer)) {
          LayerLookup.set(entity.layer, uuid.v4())
          newLayer = true;
        }
        if (newLayer) {
          docLayer.id = LayerLookup.get(entity.layer);
          docLayer.name = 'LAYER' + ': ' + entity.layer;
          state.push(docLayer);
          docFile.children.push(docLayer.id); // register layer under file
          drawEntity(entity, dxfTree, docLayer, i);
          newLayer = false;
        } else {
          drawEntity(entity, dxfTree, docLayer, i);
        }
        //drawEntity(entity, dxfTree, doc, i);
      }
    }
    //fileLayers = [ ...new Set(fileLayers) ]; // list of unique layer names
  }

  function drawEntity(entity, dxfTree, docLayer, index) {
    //console.log('inside drawEntity:  Entity ', entity, '  Index: ', index)
    if(entity.type === 'CIRCLE' || entity.type === 'ARC') {
        drawCircle(entity, index);
    } else if(entity.type === 'LWPOLYLINE' || entity.type === 'LINE' || entity.type === 'POLYLINE') {
        drawLine(entity, index, docLayer);
    } else if(entity.type === 'TEXT') {
        drawText(entity, index);
    } else if(entity.type === 'SOLID') {
        drawSolid(entity, index);
    } else if(entity.type === 'POINT') {
        drawPoint(entity, index);
    }
  }

  function drawLine(entity, index, docLayer) {
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
          for(let j = 0; j < entity.vertices.length; j++) {
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
            docEntity.strokeColor = [0,0,0,0.3];
            docEntity.fillColor = [0,0,0,0];
          }

          state.push(docEntity);
          docLayer.children.push(docEntity.id); // register feature under layer

  }

  return state;
}

export function documentsLoad(state, settings, action) {
    if (action.payload.file.type === 'image/svg+xml')
        return loadSvg(state, settings, action.payload);
    else if (action.payload.file.type === 'image/vnd.dxf')
        return loadDxf(state, settings, action.payload);
    else if (action.payload.file.type.substring(0, 6) === 'image/')
        return loadImage(state, action.payload);
    else {
        // TODO: show error in gui
        console.log('Unsupported file type:', action.payload.file.type)
        return state;
    }
}

export function documents(state, action) {
    state = documentsForest(state, action);
    switch (action.type) {
        case 'DOCUMENT_SELECT': {
            let ids = getSubtreeIds(state, action.payload.id);
            return state.map(o => Object.assign({}, o, { selected: ids.includes(o.id) }));
        }
        case 'DOCUMENT_TOGGLE_SELECT': {
            let parent = state.find(o => o.id === action.payload.id);
            if (!parent)
                return state;
            let selected = !parent.selected;
            state = reduceSubtree(state, action.payload.id, true, o => Object.assign({}, o, { selected }));
            if (!selected)
                state = reduceParents(state, action.payload.id, false, o => Object.assign({}, o, { selected: false }));
            return state;
        }
        default:
            return state;
    }
}
