import { setAttrs, add, remove } from '../actions/object'
import { OPERATION_DEFAULTS } from '../reducers/operation'
import uuidv4 from 'uuid/v4';

export const setOperationAttrs = setAttrs('operation');
export const addOperation = add('operation',OPERATION_DEFAULTS);
export const removeOperation = remove('operation');

export function operationAddDocuments(id, isTab, documents) {
    return { type: 'OPERATION_ADD_DOCUMENTS', payload: { id, isTab, documents } };
}

export function operationRemoveDocument(id, isTab, document) {
    return { type: 'OPERATION_REMOVE_DOCUMENT', payload: { id, isTab, document } };
}

export function setCurrentOperation(id) {
    return { type: 'OPERATION_SET_CURRENT', payload: id };
}

export function moveOperation(id, step) {
    return { type: 'OPERATION_MOVE_CURRENT', payload: { id, step } };
}

export function clearOperations()
{
    return { type: 'OPERATION_CLEAR_ALL' };
}

export function spreadOperationField(id, field)
{
    return { type: 'OPERATION_SPREAD_FIELD', payload: {id, field} }
}

export function operationLatheTurnAdd(id, attrs) {
    return { type: 'OPERATION_LATHE_TURN_ADD', payload: { id, attrs: { ...attrs, id: uuidv4() } } };
}

export const operationLatheTurnSetAttrs = setAttrs('operation_lathe_turn');
export const operationLatheTurnRemove = remove('operation_lathe_turn');
