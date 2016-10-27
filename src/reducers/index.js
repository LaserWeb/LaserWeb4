/**
 * Combined reducers.
 * @module reducers
 */

// Redux reducers combiner
import { combineReducers } from 'redux'

// Reducers
import { camera } from './camera'
import { documents } from './document'
import panes from './panes'
import { settings } from './settings'

// Exports compined reducer
export default combineReducers({ camera, documents, panes, settings })
