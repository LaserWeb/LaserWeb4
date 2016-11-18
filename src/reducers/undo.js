
export function undoCombineReducers(reducers,
                                    initialState={},
                                    shouldSaveUndo= (action)=>{return !['@@INIT', 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO','SPLITTER_SET_SIZE'].includes(action.type);},
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