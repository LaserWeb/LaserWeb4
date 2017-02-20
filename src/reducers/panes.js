/**
 * Panes reducer.
 * @module
 */

// React
import React from 'react'

// Actions
import * as panesActions from '../actions/panes'

const INITIAL_PANE='cam'


/**
 * Handle visible state.
 * @function
 * @protected
 * @param {Array} panes The current panes collection.
 * @param {module:lib/redux-action~Action} action The action to execute.
 * @return {Array} The new panes collection.
 */
function handleVisible(state = {}, action) {
    let visible = state.visible !== undefined ? state.visible : true

    switch (action.type) {
        case panesActions.selectPane.TYPE:
            return !visible || action.payload.id !== state.selected; 
        default:
            return visible
    }
}

function handleSelected(state = INITIAL_PANE, action) {
    switch (action.type) {
        case panesActions.selectPane.TYPE:
            return action.payload.id;
        default:
            return state;
    }
}

/**
 * Handle dock state.
 * @function
 * @param {Object} state The current state.
 * @param {module:lib/redux-action~Action} action The action to execute.
 * @return {Array} The new state.
 */
function panes(state = {}, action) {
    return {
        visible: handleVisible(state, action),
        selected: handleSelected(state.selected, action),
    }
}

// Exports
export default panes
