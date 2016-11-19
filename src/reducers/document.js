"use strict";

import { vec3 } from 'gl-matrix';
import uuid from 'node-uuid';
import Snap from 'snapsvg-cjs';

import { forest, getSubtreeIds, object, reduceParents, reduceSubtree } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'
import { elementToRawPaths, flipY } from '../lib/mesh'

const documentBase = object('document', {
    type: '?',
    name: '',
    isRoot: false,
    children: [],
    selected: false,
});

export function document(state, action) {
    switch (action.type) {
        case 'DOCUMENT_TRANSLATE_SELECTED':
            if (state.selected && state.translate) {
                return {...state, translate: vec3.add([], state.translate, action.payload) };
            } else
                return state;
        default:
            return documentBase(state, action)
    }
}

const documentsForest = forest('document', document);

function loadSvg(state, {file, content}) {
    state = state.slice();

    // TODO catch and report errors
    let svg = Snap.parse(content);
    let allPositions = [];

    function addChildren(parent, node) {
        for (let child of node.children) {
            let c = {
                id: uuid.v4(),
                type: child.nodeName,
                name: child.nodeName + ': ' + child.id,
                isRoot: false,
                children: [],
                selected: false,
                translate: [0, 0, 0],
            };
            if (child.nodeName === 'path') {
                // TODO: report errors
                // TODO: settings for pxPerInch, minNumSegments, minSegmentLength
                c.rawPaths = elementToRawPaths(child, 96, 1, .01 * 96, error => console.log(error));
                if (!c.rawPaths)
                    continue;
                allPositions.push(c.rawPaths);
            } else if (child.nodeName !== 'g')
                continue;
            state.push(c);
            parent.children.push(c.id);
            addChildren(c, child)
        }
    }

    let doc = {
        id: uuid.v4(),
        type: 'document',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
    };
    state.push(doc);
    addChildren(doc, svg.node.children[0]);
    flipY(allPositions);
    return state;
}

function loadImage(state, {file, content}) {
    let doc = {
        id: uuid.v4(),
        type: 'image',
        name: file.name,
        isRoot: true,
        children: [],
        selected: false,
        translate: [0, 0, 0],
        mimeType: file.type,
        dataURL: content,
        dpi: 96, // TODO
    };
    state.push(doc);
    console.log(doc);
    return state;
}

export function documents(state, action) {
    state = documentsForest(state, action);
    switch (action.type) {
        case 'DOCUMENT_LOAD':
            if (action.payload.file.type === 'image/svg+xml')
                return loadSvg(state, action.payload);
            else if (action.payload.file.type.substring(0, 6) === 'image/')
                return loadImage(state, action.payload);
            else {
                // TODO: show error in gui
                console.log('Unsupported file type:', action.payload.file.type)
                return state;
            }
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
