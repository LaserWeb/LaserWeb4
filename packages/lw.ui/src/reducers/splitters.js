export function splitters(state = {}, action) {
    switch (action.type) {
        case 'SPLITTER_SET_SIZE':
            return { ...state, [action.payload.id]: action.payload.size };
        default:
            return state;
    }
}
