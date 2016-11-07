import { setAttrs, add, remove } from '../actions/object'

export const setOperationAttrs = setAttrs('operation');
export const addOperation = add('operation');
export const removeOperation = remove('operation');

export function operationAddDocuments(id, documents) {
    return { type: 'OPERATION_ADD_DOCUMENTS', payload: { id, documents } };
}

export function operationRemoveDocument(id, document) {
    return { type: 'OPERATION_REMOVE_DOCUMENT', payload: { id, document } };
}

export function setCurrentOperation(id) {
    return { type: 'OPERATION_SET_CURRENT', payload: id };
}
