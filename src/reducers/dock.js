/**
 * Dock reducer.
 * @module
 */

// React
import React from 'react'

// Actions
import * as actions from '../actions/dock'

/**
 * Create and add a new button.
 * @function
 * @protected
 * @param {Array} buttons The current buttons collection.
 * @param {Object} button The new button properties. See {@link module:components/dock~Button}.
 * @return {Array} The new buttons collection with the new button added.
 */
function addButton(buttons, button) {
    return [...buttons, Object.assign({}, button, {
        id: button.id,
        active: button.active || false
    })]
}

/**
 * Remove the button.
 * @function
 * @protected
 * @param {Array} buttons The current buttons collection.
 * @param {Integer} id The button id to remove.
 * @return {Array} The new buttons collection with the new button removed.
 */
function removeButton(buttons, id) {
    return buttons
}

/**
 * Select the button.
 * @function
 * @protected
 * @param {Array} buttons The current buttons collection.
 * @param {Integer} id The button id to select.
 * @return {Array} The new buttons collection with the button selected.
 */
function selectButton(buttons, id) {
    return buttons.map(
        button => Object.assign({}, button, { active: id === button.id })
    )
}

/**
 * Handle buttons state.
 * @function
 * @protected
 * @param {Array} buttons The current buttons collection.
 * @param {module:lib/redux-action~Action} action The action to execute.
 * @return {Array} The new buttons collection.
 */
function handleButtons(buttons = [], action) {
    switch (action.type) {
        case actions.addButton.TYPE:
            return addButton(buttons, action.payload.button)
        case actions.removeButton.TYPE:
            return removeButton(buttons, action.payload.id)
        case actions.selectButton.TYPE:
            return selectButton(buttons, action.payload.id)
        default:
            return buttons
    }
}

/**
 * Handle dock state.
 * @function
 * @param {Object} state The current state.
 * @param {module:lib/redux-action~Action} action The action to execute.
 * @return {Array} The new state.
 */
function dock(state = {}, action) {
    return {
        children: handleButtons(state.children, action)
    }
}

// Exports
export default dock
