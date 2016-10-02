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
                return state.filter(o => o.id !== action.payload.id);
            default:
                return state.map(o => baseReducer(o, action));
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
                return state.filter(o => o.id !== action.payload)
                    .map(parent => Object.assign({}, parent, {
                        children: parent.children.filter(childId => childId !== action.payload)
                    }));
            default:
                return state.map(o => objectReducer(o, action));
        }
    };
};
