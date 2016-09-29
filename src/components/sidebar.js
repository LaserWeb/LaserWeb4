/**
 * Sidebar module.
 * - Handle sidebar modules.
 * @module
 */

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

// Main components
import Dock from './dock'
import Panes from './panes'

// Actions
import * as dockActions from '../actions/dock'
import * as panesActions from '../actions/panes'

/**
 * Sidebar component.
 * - Handle sidebar modules.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Sidebar extends React.Component {
    /**
     * @type {Object}
     * @member module:components/sidebar~Sidebar.prototype#props
     * @property {module:react~React~Component|module:react~React~Component[]} children Component children.
     * @property {module:components/sidebar~addModule} addModule Add module dock/pane to the sidebar.
     */

    constructor(props) {
        // Super constructor
        super(props)

        // Add each children dock/pane to the sidebar
        React.Children.forEach(this.props.children, (child) => {
            this.props.addModule(child)
        })
    }

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div id="sidebar" className="full-height">
                <Dock />
                <Panes />
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {}
}

const mapDispatchToProps = (dispatch) => {
    return {
        /**
         * Add module dock/pane to the sidebar.
         * @typedef {Function} module:components/sidebar~addModule
         * @param {module:react~React~Component} module An React component.
         */
        addModule: (module) => {
            dispatch(dockActions.addButton(module.props))
            dispatch(panesActions.addPane(module))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar)
