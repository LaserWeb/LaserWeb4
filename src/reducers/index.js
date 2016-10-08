/**
 * Combined reducers.
 * @module reducers
 */

// Redux reducers combiner
import { combineReducers } from 'redux'

// Reducers
import panes from './panes'
import { documents } from './document'

// Exports compined reducer
export default combineReducers({ panes, documents })
