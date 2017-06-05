
export function undoCombineReducers(reducers,
                                    initialState={},
                                    shouldSaveUndo= (action)=>{return !['@@INIT', 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO'].includes(action.type);},
                                    undoStateKey='history'
                    ){
  
  return (state = {}, action) => {
    if (action.type == "UNDO" && state[undoStateKey].length > 0){
      // Load previous state and pop the history
      return {
        ...Object.keys(reducers).reduce((stateKeys, key) => {
          stateKeys[key] = state[undoStateKey][0][key];
          return stateKeys || initialState;
        }, {}),
        [undoStateKey]: state[undoStateKey].slice(1)
      }
    } else {
      // Save a new undo unless the action is blacklisted
      const newHistory = shouldSaveUndo(action) ?
        [{
          ...Object.keys(reducers).reduce((stateKeys, key) => {
            stateKeys[key] = state[key];
            return stateKeys;
          }, {})
        }] : undefined;

      return {
        // Calculate the next state
        ...Object.keys(reducers).reduce((stateKeys, key) => {
          stateKeys[key] = reducers[key](state[key], action);
          return stateKeys;
        }, {}),
        [undoStateKey]: [
          ...(newHistory || []),
          ...(state[undoStateKey] || [])
        ].slice(0, 10)
      };
    }
  };
}

var LAST_ACTION = {};
var LAST_ACTION_TIMEOUT = null;
const LAST_ACTION_TTL = 2000;

const BLACKLIST = [/^(@@|redux)/gi, 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO', 'LOADED', /^SPLITTER|^MATERIALDB_|^SELECT_PANE|^GCODE_|^COM/gi];


export const shouldSaveUndo = (action) => {

    //Last action TTL
    if (LAST_ACTION_TIMEOUT)
        clearTimeout(LAST_ACTION_TIMEOUT)

    for (let item of BLACKLIST) {
        if (action.type.search(item) >= 0) {
            LAST_ACTION = action;
            return false;
        }
    }

    if (action.type === LAST_ACTION.type) {
        if (action.type.match(/_SET_ATTRS/gi)) {
            let cSig = Object.keys(action.payload.attrs).sort().join(',');
            let lSig = Object.keys(LAST_ACTION.payload.attrs).sort().join(',');
            if (cSig === lSig) {
                LAST_ACTION_TIMEOUT = setTimeout(() => { LAST_ACTION = {} }, LAST_ACTION_TTL)
                return false;
            }
        }

        if (action.type.match(/DOCUMENT_TRANSLATE_SELECTED/gi)) {
            let cSig = Object.keys(action.payload).sort().join(',');
            let lSig = Object.keys(LAST_ACTION.payload).sort().join(',');
            if (cSig === lSig) {
                LAST_ACTION_TIMEOUT = setTimeout(() => { LAST_ACTION = {} }, LAST_ACTION_TTL)
                return false;
            }
        }

    }

    LAST_ACTION = action;

    return true
};