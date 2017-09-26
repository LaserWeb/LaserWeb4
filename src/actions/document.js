import { setAttrs, add, addChild, remove } from '../actions/object'

export const setDocumentAttrs = setAttrs('document');
export const addDocument = add('document');
export const addDocumentChild = addChild('document');
export const removeDocument = remove('document');

export function selectDocument(id) {
    return { type: 'DOCUMENT_SELECT', payload: { id } };
};

export function toggleSelectDocument(id) {
    return { type: 'DOCUMENT_TOGGLE_SELECT', payload: { id } };
};

export function toggleVisibleDocument(id) {
    return { type: 'DOCUMENT_TOGGLE_VISIBLE', payload: { id } };
};

export function transform2dSelectedDocuments(transform2d) {
    return { type: 'DOCUMENT_TRANSFORM2D_SELECTED', payload: transform2d };
}

export function loadDocument(file, content, modifiers = {}, context = undefined) {
    return { type: 'DOCUMENT_LOAD', payload: { file, content, context, modifiers } };
}

export function removeDocumentSelected() {
    return { type: 'DOCUMENT_REMOVE_SELECTED' };
}

export function cloneDocumentSelected() {
    return { type: 'DOCUMENT_CLONE_SELECTED' };
}

export function selectDocuments(meta){
    return { type: 'DOCUMENT_SELECT_META', payload:{meta} };
}

export function colorDocumentSelected(color){
    return { type: 'DOCUMENT_COLOR_SELECTED', payload:{color} };
}