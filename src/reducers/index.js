/**
 * Combined reducers.
 * @module reducers
 */

// Redux reducers combiner
import { combineReducers } from 'redux'

// Reducers
import panes from './panes'
import { settings } from './settings'
import { documents } from './document'

// Exports compined reducer
export default combineReducers({ panes, settings, documents })
