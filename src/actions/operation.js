import { setAttrs, add, remove } from '../actions/object'

export const setOperationAttrs = setAttrs('operation');
export const addOperation = add('operation');
export const removeOperation = remove('operation');

export function operationRemoveDocument(id, document) {
    return { type: 'OPERATION_REMOVE_DOCUMENT', payload: { id, document } };
}
