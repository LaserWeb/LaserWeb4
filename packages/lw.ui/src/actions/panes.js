/**
 * Panes actions.
 * @module
 */

// Redux action creator factory
import ACF from '../lib/redux-action'

/**
 * Create and return the SELECT_PANE action.
 * @function
 * @param {Integer} id The pane id.
 * @return {module:lib/redux-action~Action}
 */
export const selectPane = ACF('SELECT_PANE', 'id')
