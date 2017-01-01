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
    visible: true,
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

export function documentsLoad(state, settings, action) {
    if (action.payload.file.type === 'image/svg+xml')
        return loadSvg(state, settings, action.payload);
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
        case 'DOCUMENT_TOGGLE_VISIBLE': {
            let parent = state.find(o => o.id === action.payload.id);
            if (!parent)
                return state;
            let visible = !parent.visible;
            state = reduceSubtree(state, action.payload.id, true, o => Object.assign({}, o, { visible }));
            return state;
        }
        default:
            return state;
    }
}
