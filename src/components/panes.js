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
            <div className={ "pane" + (this.props.active ? " active" : "") + " pane-"+this.props.id}>
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
     * @property {module:react~React~Component|module:react~React~Component[]} children Component children.
     */

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div className={"panes full-height"} style={this.props.style}>
                {
                    React.Children.map(this.props.children, item => (
                        <Pane
                            {...item.props}
                            key={item.props.id}
                            id ={item.props.id} 
                            active={item.props.id === this.props.selected}
                            >
                            {item}
                        </Pane>))
                }
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selected: state.panes.selected,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

// Exports
export { Panes, Pane }
export default connect(mapStateToProps, mapDispatchToProps)(Panes)
