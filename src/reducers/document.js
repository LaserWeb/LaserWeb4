"use strict";

import Snap from 'snapsvg-cjs';
import uuid from 'node-uuid';

import { forest, getSubtreeIds, object, reduceSubtree } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'
import { elementToPositions, flipY } from '../lib/mesh'

export const document = object('document', {
    type: 'document',
    name: '',
    children: [],
});

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
                children: [],
            };
            if (child.nodeName === 'path') {
                // TODO: report errors
                // TODO: settings for pxPerInch, minNumSegments, minSegmentLength
                c.positions = elementToPositions(child, 90, 1, .1, error => console.log(error));
                if (!c.positions)
                    continue;
                allPositions.push(c.positions);
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
        children: [],
    };
    state.push(doc);
    addChildren(doc, svg.node.children[0]);
    flipY(allPositions);
    return state;
}

export function documents(state, action) {
    state = documentsForest(state, action);
    switch (action.type) {
        case 'DOCUMENT_LOAD':
            switch (action.payload.file.type) {
                case 'image/svg+xml':
                    return loadSvg(state, action.payload);
                default:
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
            console.log('sss', parent.id, parent.selected, parent)
            return reduceSubtree(state, action.payload.id, true, o => Object.assign({}, o, { selected }));
        }
        default:
            return state;
    }
}

export function documentsWithSampleData(state, action) {
    if (state === undefined) {
        state = documents(state, {});
        let doc1 = addDocument({ name: 'dummy1.svg' });
        let doc2 = addDocument({ name: 'dummy2.svg' });
        let doc2Layer1 = addDocumentChild(doc2.payload.attrs.id, { name: 'layer1', type: 'layer' });
        let doc2Layer2 = addDocumentChild(doc2.payload.attrs.id, { name: 'layer2', type: 'layer' });
        let doc3 = addDocument({ name: 'dummy3.svg' });
        state = documents(state, doc1);
        state = documents(state, doc2);
        state = documents(state, doc2Layer1);
        state = documents(state, doc2Layer2);
        state = documents(state, doc3);
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'rect3', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'rect3', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'path4', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'path5', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'rect6', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'rect3', type: 'path' }));
    }
    return documents(state, action);
};
