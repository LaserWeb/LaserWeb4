/**
 * Combined reducers.
 * @module reducers
 */

// Redux reducers combiner
import { combineReducers } from 'redux'

// Reducers
import dock from './dock'
import panes from './panes'
import {documentsWithSampleData } from './document'

// Exports compined reducer
export default combineReducers({ dock, panes, documents:documentsWithSampleData })
