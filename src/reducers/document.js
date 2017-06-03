"use strict";

import { mat2d, mat3, vec3 } from 'gl-matrix';
import uuid from 'node-uuid';
import Snap from 'snapsvg-cjs';

//import { forest, getSubtreeIds, object, reduceParents, reduceSubtree } from '../reducers/object'
import { forest, changedArray, object, getSubtreeIds, reduceSubtree, getParentIds, reduceParents } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'
import { elementToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'
import { processDXF } from '../lib/dxf'

import CommandHistory from '../components/command-history'
import { alert } from '../components/laserweb'

export const DOCUMENT_INITIALSTATE = {
    id: '',
    type: '?',
    name: '',
    mimeType: '',
    isRoot: false,
    children: [],
    selected: false,
    visible: true,
    transform2d: null,
    rawPaths: null,
    strokeColor: null,
    fillColor: null,
    dataURL: '',
    originalPixels: null,
    originalSize: null,
};

const documentBase = object('document', DOCUMENT_INITIALSTATE);

export function document(state, action) {
    switch (action.type) {
        case 'DOCUMENT_TRANSFORM2D_SELECTED':
            if (state.selected && state.transform2d)
                return { ...state, transform2d: mat2d.multiply([], action.payload, state.transform2d) };
            else
                return state;
        default:
            return documentBase(state, action)
    }
}

const documentsForest = forest('document', document);

function loadSvg(state, settings, { file, content }, id = uuid.v4()) {
    let { parser, tags } = content;
    state = state.slice();
    let pxPerInch = (settings.pxPerInch) ? +settings.pxPerInch : 96;
    let allPositions = [];

    function getColor(c) {
        let sc = Snap.color(c);
        if (sc.r === -1 || sc.g === -1 || sc.b === -1)
            return [0, 0, 0, 0];
        else
            return [sc.r / 255, sc.g / 255, sc.b / 255, 1];
    }

    function mat2dFromSnap(m) {
        return [m.a, m.b, m.c, m.d, m.e / pxPerInch * 25.4, m.f / pxPerInch * 25.4];
    }

    let viewBoxDeltaX = -parser.document.viewBox.x / pxPerInch * 25.4;
    let viewBoxDeltaY = (parser.document.viewBox.y + parser.document.viewBox.height) / pxPerInch * 25.4;

    function addChildren(parent, tag, parentMat) {
        for (let child of tag.children) {
            let localMat = mat2dFromSnap(Snap(child.element).transform().localMatrix);
            let combinedMat = mat2d.mul([], parentMat, localMat);
            let c = {
                ...DOCUMENT_INITIALSTATE,
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
                for (let point of path.points) {
                    let x = (combinedMat[0] * point.x + combinedMat[2] * point.y) / pxPerInch * 25.4 + combinedMat[4];
                    let y = (combinedMat[1] * point.x + combinedMat[3] * point.y) / pxPerInch * 25.4 + combinedMat[5];
                    p.push(viewBoxDeltaX + x, viewBoxDeltaY - y);
                }
                if (p.length)
                    rawPaths.push(p);
            }
            if (rawPaths.length) {
                allPositions.push(rawPaths);
                c.rawPaths = rawPaths;
                c.transform2d = [1, 0, 0, 1, 0, 0];
                c.strokeColor = getColor(child.attrs.stroke);
                c.fillColor = getColor(child.attrs.fill);
                if (hasClosedRawPaths(rawPaths)) {
                    if (!c.fillColor[3] && !c.strokeColor[3])
                        c.fillColor[3] = .3;
                } else if (!c.strokeColor[3])
                    c.strokeColor[3] = .3;
            } else if (child.name === 'image') {
                let element = child.element;
                let dataURL = element.getAttribute('xlink:href');
                if (dataURL.substring(0, 5) !== 'data:')
                    continue;
                let rawX = element.x.baseVal.value;
                let rawY = element.y.baseVal.value;
                let rawW = element.width.baseVal.value;
                let rawH = element.height.baseVal.value;
                let x = rawX / pxPerInch * 25.4;
                let y = rawY / pxPerInch * 25.4;
                let w = (rawX + rawW) / pxPerInch * 25.4 - x;
                let h = (rawY + rawH) / pxPerInch * 25.4 - y;
                let t = [w / child.naturalWidth, 0, 0, -h / child.naturalHeight, x, y + h];
                t = mat2d.mul([], combinedMat, t);
                t = mat2d.mul([], [1, 0, 0, -1, viewBoxDeltaX, viewBoxDeltaY], t);
                c = {
                    ...c,
                    transform2d: t,
                    mimeType: file.type,
                    dataURL: dataURL,
                };
            }
            state.push(c);
            parent.children.push(c.id);
            addChildren(c, child, combinedMat)
        }
    }

    let doc = {
        ...DOCUMENT_INITIALSTATE,
        id: id,
        type: 'document',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
    };
    state.push(doc);
    addChildren(doc, tags, [1, 0, 0, 1, 0, 0]);
    return state;
}

function processImage(doc, settings, context) {
    if (!context) {
        CommandHistory.warn('Cannot process image ' + doc.name)
        return doc;
    }

    // Adjusting by Quadrant setting.
    let imageWidth = context.naturalWidth / settings.dpiBitmap * 25.4;
    let imageHeight = context.naturalHeight / settings.dpiBitmap * 25.4;

    doc.originalPixels = [context.naturalWidth, context.naturalHeight];
    doc.originalSize = [imageWidth, imageHeight];

    switch (settings.toolImagePosition) {
        case 'TL':
            doc.transform2d[4] = 0;
            doc.transform2d[5] = settings.machineHeight - imageHeight;
            break;
        case 'TR':
            doc.transform2d[4] = settings.machineWidth - imageWidth;
            doc.transform2d[5] = settings.machineHeight - imageHeight;
            break;
        case 'BL':
            doc.transform2d[4] = 0;
            doc.transform2d[5] = 0;
            break;
        case 'BR':
            doc.transform2d[4] = settings.machineWidth - imageWidth;
            doc.transform2d[5] = 0;
            break;
        case 'C':
            doc.transform2d[4] = (settings.machineWidth - imageWidth) / 2;
            doc.transform2d[5] = (settings.machineHeight - imageHeight) / 2;
            break;
    }

    return doc;
}

function loadImage(state, settings, { file, content, context }, id = uuid.v4()) {
    state = state.slice();
    let scale = 25.4 / settings.dpiBitmap;
    let doc = {
        ...DOCUMENT_INITIALSTATE,
        id: id,
        type: 'image',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
        transform2d: [scale, 0, 0, scale, 0, 0],
        mimeType: file.type,
        dataURL: content,
    };

    doc = processImage(doc, settings, context);
    state.push(doc);
    return state;
}

function loadDxf(state, settings, { file, content }, id = uuid.v4()) {
    state = state.slice();
    let docFile = {
        ...DOCUMENT_INITIALSTATE,
        id: id,
        type: 'document',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
    };
    state.push(docFile); // state[0] is the file root structure
    state = processDXF(state, docFile, content);
    return state;
}

export function documentsLoad(state, settings, action) {
    state = state.slice();
    let docId;

    if (action.payload.modifiers.shift) {
        console.warn('Replacing occurrences of ' + action.payload.file.name)
        let doc = state.find((doc, index, docs) => doc.name === action.payload.file.name)
        if (doc) {
            docId = doc.id;
            let ids = getSubtreeIds(state, docId);
            state = state.filter(o => !ids.includes(o.id))
                .map(parent => Object.assign({}, parent, {
                    children: parent.children.filter(childId => childId !== docId)
                }));
        }
    }

    if (action.payload.file.type === 'image/svg+xml')
        return loadSvg(state, settings, action.payload, docId);
    else if (action.payload.file.name.substr(-4).toLowerCase() === '.dxf')
        return loadDxf(state, settings, action.payload, docId);
    else if (action.payload.file.type.substring(0, 6) === 'image/') {
        return loadImage(state, settings, action.payload, docId);
    } else {
        alert('Unsupported file type:' + action.payload.file.type)
        console.error('Unsupported file type:', action.payload.file.type)
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
        case 'DOCUMENT_TOGGLE_VISIBLE': {
            let parent = state.find(o => o.id === action.payload.id);
            if (!parent)
                return state;
            let visible = !parent.visible;
            state = reduceSubtree(state, action.payload.id, true, o => Object.assign({}, o, { visible }));
            if (visible)
                state = reduceParents(state, action.payload.id, true, o => Object.assign({}, o, { visible: true }));
            return state;
        }
        case "DOCUMENT_REMOVE_SELECTED":
            return state.filter(d => !d.selected);
        case 'WORKSPACE_RESET':
            return [];
        default:
            return state;
    }
}
