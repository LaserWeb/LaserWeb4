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

export function translateSelectedDocuments(amount) {
    return { type: 'DOCUMENT_TRANSLATE_SELECTED', payload: amount };
}

export function scaleTranslateSelectedDocuments(scale, translate) {
    return { type: 'DOCUMENT_SCALE_TRANSLATE_SELECTED', payload: { scale, translate } };
}

export function loadDocument(file, content) {
    return { type: 'DOCUMENT_LOAD', payload: { file, content } };
}
