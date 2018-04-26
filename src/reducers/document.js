"use strict";

import { mat2d, mat3, vec3 } from 'gl-matrix';
import uuidv4 from 'uuid/v4';
import Snap from 'snapsvg';

//import { forest, getSubtreeIds, object, reduceParents, reduceSubtree } from '../reducers/object'
import { forest, changedArray, object, getSubtreeIds, reduceSubtree, getParentIds, reduceParents } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'
import { pathStrToRawPaths, flipY, hasClosedRawPaths } from '../lib/mesh'
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
        case 'LOADED':
            state = { ...state };
            if (state.translate && state.scale && !state.transform2d) {
                if (state.dataURL && state.dpi)
                    state.transform2d = [state.scale[0] / state.dpi * 25.4, 0, 0, state.scale[1] / state.dpi * 25.4, state.translate[0], state.translate[1]];
                else
                    state.transform2d = [state.scale[0], 0, 0, state.scale[1], state.translate[0], state.translate[1]];
            }
            delete state.scale;
            delete state.translate;
            delete state.dpi;
            state.transform2d = state.transform2d || null;
            state.originalPixels = state.originalPixels || null;
            state.originalSize = state.originalSize || null;
            return documentBase(state, action);
        default:
            return documentBase(state, action);
    }
}

const documentsForest = forest('document', document);

function loadSvg(state, settings, { file, content }, id = uuidv4()) {
    let { parser, tags, attrs = {} } = content;
    state = state.slice();
    let pxPerInch = (settings.pxPerInch) ? +settings.pxPerInch : 96;
    let allPositions = [];

    if (tags.element.width && parser.document.viewBox.width && !settings.forcePxPerInch) {
        let v = tags.element.width.baseVal;
        v.convertToSpecifiedUnits(v.SVG_LENGTHTYPE_IN);
        let w = v.valueInSpecifiedUnits;
        if (w)
            pxPerInch = parser.document.viewBox.width / w;
    }

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

    function applyToPoint(t, x, y) {
        return [
            x * t[0] + y * t[2] + t[4],
            x * t[1] + y * t[3] + t[5]
        ]
    }

    function addChildren(parent, tag, parentMat, precision = 0.1) {
        for (let child of tag.children) {
            let localMat = mat2dFromSnap(Snap(child.element).transform().localMatrix);
            let combinedMat = mat2d.mul([], parentMat, localMat);
            let c = {
                ...DOCUMENT_INITIALSTATE,
                id: uuidv4(),
                type: child.name,
                name: child.name + ': ' + child.attrs.id,
                isRoot: false,
                children: [],
                selected: false,
            };

            let rawPaths = [];
            let addPoint = (path, svgX, svgY) => {
                let x = (combinedMat[0] * svgX + combinedMat[2] * svgY) / pxPerInch * 25.4 + combinedMat[4];
                let y = (combinedMat[1] * svgX + combinedMat[3] * svgY) / pxPerInch * 25.4 + combinedMat[5];
                let [tx, ty] = applyToPoint(attrs.transform2d || [1, 0, 0, 1, 0, 0], viewBoxDeltaX + x, viewBoxDeltaY - y)
                path.push(tx, ty);
            };
            if (child.name === 'path') {
                let paths = pathStrToRawPaths(child.attrs.d, 25.4, 1, Math.max(precision,0.1) * pxPerInch / 25.4, error => console.log(error));
                if (paths)
                    for (let path of paths) {
                        let p = [];
                        for (let i = 0; i < path.length; i += 2)
                            addPoint(p, path[i], path[i + 1]);
                        if (p.length)
                            rawPaths.push(p);
                    }
            } else {
                for (let path of child.getPaths()) {
                    let p = [];
                    for (let point of path.points)
                        addPoint(p, point.x, point.y);
                    if (p.length)
                        rawPaths.push(p);
                }
            }

            if (rawPaths.length) {
                allPositions.push(rawPaths);
                c.rawPaths = rawPaths;
                c.transform2d = [1, 0, 0, 1, 0, 0];
                c.strokeColor = getColor(child.attrs.stroke);
                c.fillColor = getColor(child.attrs.fill);
                if (hasClosedRawPaths(rawPaths)) {
                    if (!c.fillColor[3] && !c.strokeColor[3])
                        c.fillColor[3] = .8;
                } else if (!c.strokeColor[3])
                    c.strokeColor[3] = .8;
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
    addChildren(doc, tags, [1, 0, 0, 1, 0, 0], settings.gcodeCurvePrecision);
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

function loadImage(state, settings, { file, content, context }, id = uuidv4()) {
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

function replaceImage(state, settings, { file, content, context }, id = uuidv4()) {
    return state.map((doc, index, docs) => {
        if (doc.name === file.name)
            return Object.assign(doc, { dataURL: content });
        return doc;
    })
}

function loadDxf(state, settings, { file, content }, id = uuidv4()) {
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
        CommandHistory.warn('Replacing occurrences of ' + action.payload.file.name)
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
        if (action.payload.modifiers.ctrl || action.payload.modifiers.meta) {
            CommandHistory.warn('Replacing content of ' + action.payload.file.name)
            return replaceImage(state, settings, action.payload, docId);
        } else {
            return loadImage(state, settings, action.payload, docId);
        }
    } else {
        alert('Unsupported file type:' + action.payload.file.type)
        console.error('Unsupported file type:', action.payload.file.type)
        return state;
    }
}

export function cloneDocument(forest, rootId, renamer=(d)=>(d.name))
{
    let parent = forest.find(o => o.id === rootId);
    let idMap={}
    let docs=getSubtreeIds(forest, rootId).map((i,index)=>{
            let o=forest.find(o => o.id === i)
            if (o) {
                idMap[o.id]=uuidv4()
                return Object.assign({},o,{id: idMap[o.id], name: renamer(o,index), selected:false, isRoot: !index})
            }
        }).filter(e=>(e!==undefined)).map((item,index)=>{
            item.children=item.children.map(c=>(idMap[c]));
            return item;
        })
    
    return docs;
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

        case 'DOCUMENT_SELECT_META': {
            if (action.payload.meta===true || action.payload.meta===false){
                return state.map((o)=>{ return Object.assign({},o,{selected: action.payload.meta})})
            }
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

        case 'DOCUMENT_CLONE_SELECTED': {
            let clones=[];
            let tree=state.filter(d => d.selected).filter((d,index,t)=>{
                return !t.find(i=>(i.selected && i.children.includes(d.id)));
            })
            const countOf=(name)=>{ return state.filter(d=>d.isRoot && (d.name.indexOf(name)>=0)).length;}

            tree.forEach((sel) => {
                let cloned=cloneDocument(state, sel.id,(d,index)=>{
                    if (index) return d.name
                    let re=/([^\(]+) \(([0-9]+)\)/gi
                    return d.name.match(re) ?  d.name.replace(re,(str,p)=>{
                        return `${p} (${countOf(p)})`
                    }) : `${d.name} (${countOf(d.name)})`
                })
                if (cloned.length) 
                    clones= [...clones,...cloned];
            })

            return [...state,...clones];
        }

        case "DOCUMENT_REMOVE_SELECTED": {
            let ids = [];
            state.filter(d => d.selected).forEach((sel) => { ids = [...ids, ...getSubtreeIds(state, sel.id)]; })
            return state.filter(o => (!ids.includes(o.id))).map(parent => {
                return Object.assign({}, parent, { children: parent.children.filter(c => (!ids.includes(c))) })
            });
        }

        case "DOCUMENT_COLOR_SELECTED": {
            return state.map((o)=>{
                if (!o.selected) return o;
                return Object.assign({},o,action.payload.color)
            }) 
            return state;
        }

        case 'WORKSPACE_RESET':
            return [];
        default:
            return state;
    }
}
