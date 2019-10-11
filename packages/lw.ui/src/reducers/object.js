// Copyright 2014, 2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// TODO: need a better name than 'object'. Some name that's pretty general.

// Actions:
//      add:        returns a new object with attrs set
//      addChild:   returns a new object with attrs set
//      setAttrs:   sets attrs, but only if action.payload.id === state.id
export function object(objectType, initialState) {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let setAttrs = objectType.toUpperCase() + '_SET_ATTRS';
    return (state, action) => {
        if (action.type === add || action.type === addChild)
            return Object.assign({}, initialState, action.payload.attrs);
        else if (action.type === setAttrs && action.payload.id === state.id)
            return Object.assign({}, state, action.payload.attrs);
        else if (action.type === 'LOADED')
            return loaded(objectType, state, initialState);
        else
            return state;
    };
};

// Actions:
//      add:        returns a new object with attrs set
//      addChild:   returns a new object with attrs set
//      setAttrs:   sets attrs, ignores id
export function objectNoId(objectType, initialState) {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let setAttrs = objectType.toUpperCase() + '_SET_ATTRS';
    return (state = initialState, action) => {
        if (action.type === add || action.type === addChild)
            return Object.assign({}, initialState, action.payload.attrs);
        else if (action.type === setAttrs)
            return Object.assign({}, state, action.payload.attrs);
        else if (action.type === 'LOADED')
            return loaded(objectType, state, initialState);
        else
            return state;
    };
};

// Actions:
//      add:        adds a new object to array and sets attrs
//      remove:     removes object from array
// baseReducer should be object(objectType, ...)
export function objectArray(objectType, baseReducer) {
    let add = objectType.toUpperCase() + '_ADD';
    let remove = objectType.toUpperCase() + '_REMOVE';
    return (state = [], action) => {
        switch (action.type) {
            case add:
                return [...state, baseReducer(undefined, action)];
            case remove:
                return state.filter(o => o.id !== action.payload);
            default:
                return changedArray(state, state.map(o => baseReducer(o, action)));
        }
    };
};

// A forest (a tree with multiple roots) looks like this.
// [
//     {
//         id: 'uuid-for-root-1',
//         children: ['uuid-for-child', ...],
//         more attrs...
//     },
//     {
//         id: 'uuid-for-child',
//         children: ['uuid-for-grandchild', ...],
//         more attrs...
//     },
//     {
//         id: 'uuid-for-grandchild',
//         children: [...],
//         more attrs...
//     },
// ]

// Actions:
//      add:        adds a new object to array and sets attrs. Use this to add roots.
//      addChild:   adds a new object to array and sets attrs. Also adds it to parent.
//      remove:     removes object from array. Also removes it from any parents.
// objectReducer should be object(objectType, ...)
export function forest(objectType, objectReducer) {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let remove = objectType.toUpperCase() + '_REMOVE';
    return (state = [], action) => {
        switch (action.type) {
            case add:
                return [...state, objectReducer(undefined, action)];
            case addChild:
                return [
                    ...state.map(o => {
                        if (o.id === action.payload.parentId)
                            return Object.assign(
                                {}, o, { children: [...o.children, action.payload.attrs.id] });
                        else
                            return o;
                    }),
                    objectReducer(undefined, action)
                ];
            case remove:
                let ids = getSubtreeIds(state, action.payload);
                return state.filter(o => !ids.includes(o.id))
                    .map(parent => Object.assign({}, parent, {
                        children: parent.children.filter(childId => childId !== action.payload)
                    }));
            default:
                return changedArray(state, state.map(o => objectReducer(o, action)));
        }
    };
};

function loaded(objectType, state, initialState) {
    let merged = { ...initialState };
    for (let attr in merged) {
        if (attr in state)
            merged[attr] = state[attr];
        else
            console.warn(objectType + '.' + attr, 'missing; setting to', merged[attr]);
    }
    for (let attr in state)
        if (!(attr in initialState))
            console.warn(objectType + '.' + attr, 'unknown; discarding');
    return merged;
}

export function changedArray(state, newState) {
    if (newState.length !== state.length)
        return newState;
    for (let i = 0; i < state.length; ++i)
        if (newState[i] !== state[i])
            return newState;
    return state;
}

export function getSubtreeIds(forest, rootId) {
    let ids = [rootId];
    for (let i = 0; i < ids.length; ++i) {
        let o = forest.find(o => o.id === ids[i]);
        if (o)
            for (let id of o.children)
                ids.push(id);
    }
    return ids;
}

export function reduceSubtree(forest, rootId, includeRoot, reduce) {
    let ids = getSubtreeIds(forest, rootId);
    return forest.map(o => {
        if ((includeRoot || o.id !== rootId) && ids.includes(o.id))
            return reduce(o);
        else
            return o;
    })
}

export function getParentIds(forest, childId) {
    let ids = [childId];
    for (let i = 0; i < ids.length; ++i) {
        let o = forest.find(o => o.children.includes(ids[i]));
        if (o)
            ids.push(o.id);
    }
    return ids;
}

export function reduceParents(forest, rootId, includeRoot, reduce) {
    let ids = getParentIds(forest, rootId);
    return forest.map(o => {
        if ((includeRoot || o.id !== rootId) && ids.includes(o.id))
            return reduce(o);
        else
            return o;
    })
}
