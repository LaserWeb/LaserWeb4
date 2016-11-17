
export function undoCombineReducers(reducers, initialState={},
                                    shouldSaveUndo= (action)=>{return !['@@INIT', 'REDUX_STORAGE_SAVE', 'REDUX_STORAGE_LOAD', 'UNDO','SPLITTER_SET_SIZE'].includes(action.type)}
                    ){
  
  return (state = {}, action) => {
    if (action.type == "UNDO" && state.history.length > 0){
      // Load previous state and pop the history
      return {
        ...Object.keys(reducers).reduce((stateKeys, key) => {
          stateKeys[key] = state.history[0][key];
          return stateKeys || initialState;
        }, {}),
        history: state.history.slice(1)
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
        history: [
          ...(newHistory || []),
          ...(state.history || [])
        ].slice(0, 10)
      };
    }
  };
}