/**
 * Panes reducer.
 * @module
 */

// React
import React from 'react'

// Actions
import * as panesActions from '../actions/panes'
import * as dockActions from '../actions/dock'

/**
 * Create and add a new pane.
 * @function
 * @protected
 * @param {Array} panes The current panes collection.
 * @param {module:react~React~Component} pane The component to add. See {@link module:components/dock~Pane}.
 * @return {Array} The new panes collection with the new pane added.
 */
function addPane(panes, pane) {
    return [...panes, Object.assign({}, pane.props, {
        id: pane.props.id,
        active: pane.props.active || false,
        children: pane
    })]
}

/**
 * Remove the pane.
 * @function
 * @protected
 * @param {Array} panes The current panes collection.
 * @param {Integer} id The pane id to remove.
 * @return {Array} The new panes collection with the new pane removed.
 */
function removePane(panes, id) {
    return panes
}

/**
 * Select the pane.
 * @function
 * @protected
 * @param {Array} panes The current panes collection.
 * @param {Integer} id The pane id to select.
 * @return {Array} The new panes collection with the pane selected.
 */
function selectPane(panes, id) {
    return panes.map(
        pane => Object.assign({}, pane, { active: id === pane.id })
    )
}

/**
 * Handle panes state.
 * @function
 * @protected
 * @param {Array} panes The current panes collection.
 * @param {module:lib/redux-action~Action} action The action to execute.
 * @return {Array} The new panes collection.
 */
function handlePanes(state = {}, action) {
    let panes = state.children || []

    switch (action.type) {
        case panesActions.addPane.TYPE:
            return addPane(panes, action.payload.pane)
        case panesActions.removePane.TYPE:
            return removePane(panes, action.payload.id)
        case panesActions.selectPane.TYPE:
        case dockActions.selectButton.TYPE:
            return selectPane(panes, action.payload.id)
        default:
            return panes
    }
}

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
    let panes = state.children || []

    switch (action.type) {
        case panesActions.selectPane.TYPE:
        case dockActions.selectButton.TYPE:
            if (! visible) {
                return true
            }

            let id = action.payload.id

            panes.forEach(pane => {
                if (pane.id === id && pane.active) {
                    visible = false
                }
            })

            return visible
        default:
            return visible
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
        children: handlePanes(state, action)
    }
}

// Exports
export default panes
