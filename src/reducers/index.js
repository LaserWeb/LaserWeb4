/**
 * Combined reducers.
 * @module reducers
 */

// Redux reducers combiner
import { combineReducers } from 'redux'

// Reducers
import dock from './dock'
import panes from './panes'

// Exports compined reducer
export default combineReducers({ dock, panes })
