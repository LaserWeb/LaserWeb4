/**
 * Dock actions.
 * @module
 */

// Redux action creator factory
import ACF from '../lib/redux-action'

/**
 * Create and return the ADD_BUTTON action.
 * @function
 * @param {Object} button The button properties. See {@link module:components/dock~Button}.
 * @return {module:lib/redux-action~Action}
 */
export const addButton = ACF('ADD_BUTTON', 'button')

/**
 * Create and return the REMOVE_BUTTON action.
 * @function
 * @param {Integer} id The button id.
 * @return {module:lib/redux-action~Action}
 */
export const removeButton = ACF('REMOVE_BUTTON', 'id')

/**
 * Create and return the SELECT_BUTTON action.
 * @function
 * @param {Integer} id The button id.
 * @return {module:lib/redux-action~Action}
 */
export const selectButton = ACF('SELECT_BUTTON', 'id')
