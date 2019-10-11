// TODO: need a better name than 'object'. Some name that's pretty general.

import uuidv4 from 'uuid/v4';

// Set attributes on an object.
//
// objectType:  e.g. 'document', 'operation'. Case ignored.
// attrs:       e.g. {type: 'pocket', depth: 7}
// id
export function setAttrs(objectType) {
    let type = objectType.toUpperCase() + '_SET_ATTRS';
    return (attrs, id) => ({ type, payload: { id, attrs } });
};

// Add an object to a container.
//
// objectType:  e.g. 'document', 'operation'. Case ignored.
// defaults: altered state callback for the first population
// attrs:       optional. e.g. {type: 'pocket', depth: 7}
export function add(objectType, defaults=function(){return {}}) {
    let type = objectType.toUpperCase() + '_ADD';
    return (attrs) => ({ type, payload: { attrs: { ...defaults(), ...attrs, id: attrs.id || uuidv4() } } });
};

// Add a child to a parent. attrs is optional.
//
// objectType:  e.g. 'document', 'operation'. Case ignored.
// parentId
// attrs:       optional. e.g. {type: 'pocket', depth: 7}
export function addChild(objectType) {
    let type = objectType.toUpperCase() + '_ADD_CHILD';
    return (parentId, attrs) =>
        ({ type, payload: { parentId, attrs: { ...attrs, id: attrs.id || uuidv4() } } });;
};

// Remove an object from a container.
//
// objectType:  e.g. 'document', 'operation'. Case ignored.
// id
export function remove(objectType) {
    let type = objectType.toUpperCase() + '_REMOVE';
    return (id) => ({ type, payload: id });
};
