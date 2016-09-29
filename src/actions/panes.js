/**
 * Panes actions.
 * @module
 */

// Redux action creator factory
import ACF from '../lib/redux-action'

/**
 * Create and return the ADD_PANE action.
 * @function
 * @param {Object} pane The pane properties. See {@link module:components/panes~Pane}.
 * @return {module:lib/redux-action~Action}
 */
export const addPane = ACF('ADD_PANE', 'pane')

/**
 * Create and return the REMOVE_PANE action.
 * @function
 * @param {Integer} id The pane id.
 * @return {module:lib/redux-action~Action}
 */
export const removePane = ACF('REMOVE_PANE', 'id')

/**
 * Create and return the SELECT_PANE action.
 * @function
 * @param {Integer} id The pane id.
 * @return {module:lib/redux-action~Action}
 */
export const selectPane = ACF('SELECT_PANE', 'id')
