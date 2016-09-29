/**
 * Panes module.
 * - Handle panes.
 * @module
 */

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

/**
 * Pane component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Pane extends React.Component {
    /**
     * @type {Object}
     * @member module:components/pane~Pane.prototype#props
     * @property {String} key Pane key.
     * @property {String} title Pane title.
     * @property {String} icon Pane icon name (font-awesome).
     * @property {Boolean} active True if active button.
     * @property {module:react~React~Component|module:react~React~Component[]} children Component children.
     */

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div className={ "pane" + (this.props.active ? " active" : "") }>
                <h4 className="pane-title">{ this.props.title }</h4>
                <div className="pane-content">{ this.props.children }</div>
            </div>
        )
    }
}

/**
 * Panes component.
 * - Handle panes.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Panes extends React.Component {
    /**
     * @type {Object}
     * @member module:components/pane~Panes.prototype#props
     * @property {Boolean} visible True if visible.
     * @property {module:react~React~Component|module:react~React~Component[]} children Component children.
     */

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div className={ "panes full-height " + (this.props.visible ? "" : "hidden") }>
                { this.props.children.map(pane => <Pane key={ pane.id } { ...pane } />) }
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        visible: state.panes.visible,
        children: state.panes.children
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

// Exports
export { Panes, Pane }
export default connect(mapStateToProps, mapDispatchToProps)(Panes)
