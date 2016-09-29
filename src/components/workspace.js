/**
 * Workspace module.
 * - Handle workspace modules.
 * @module
 */

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

/**
 * Workspace component.
 * - Handle workspace modules.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Workspace extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div id="workspace" className={ (this.props.fullWidth ? "full-width" : "") + " full-height" }>
                <p>workspace</p>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        fullWidth: !state.panes.visible
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

// Exports
export default connect(mapStateToProps, mapDispatchToProps)(Workspace)
