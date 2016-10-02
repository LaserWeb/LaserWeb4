import {setAttrs, add, addChild, remove} from '../actions/object'

export const setDocumentAttrs = setAttrs('document');
export const addDocument = add('document');
export const addDocumentChild = addChild('document');
export const removeDocument = remove('document');
