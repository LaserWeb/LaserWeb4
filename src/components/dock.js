/**
 * Dock module.
 * @module
 */

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

// Font awesome
import Icon from './font-awesome'

// Actions
import * as actions from '../actions/panes'

/**
 * Dock item component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Button extends React.Component {
    /**
     * @type {Object}
     * @member module:components/dock~Button.prototype#props
     * @property {String} key Button key.
     * @property {String} title Button title.
     * @property {String} icon Button icon name (font-awesome).
     * @property {Boolean} active True if active button.
     * @property {module:components/dock~onButtonClick} onClick Called on dock item click.
     */

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <li className={ this.props.active ? "active" : null } onClick={ this.props.onClick } >
                <div>
                    <Icon name={ this.props.icon } fw={ true } />
                    <span>{ this.props.title }</span>
                </div>
            </li>
        )
    }
}

/**
 * Dock component.
 * - Handle dock buttons.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Dock extends React.Component {
    /**
     * @type {Object}
     * @member module:components/dock~Dock.prototype#props
     * @property {module:react~React~Component|module:react~React~Component[]} children Component children.
     * @property {module:components/dock~onButtonClick} onClick Called on dock item click.
     */

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <ul className="dock full-height">
                {
                    React.Children.map(this.props.children, item => (
                        <Button
                            {...item.props}
                            key={item.props.id}
                            active={item.props.id === this.props.selected}
                            onClick={() => this.props.onButtonClick(item.props.id)}
                            />))
                }
            </ul>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selected: state.panes.selected,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        /**
         * Called on dock item click.
         * - Select and set item ative.
         * @typedef {Function} module:components/dock~onButtonClick
         * @param {Integer} id Clicked item id.
         */
        onButtonClick: (id) => {
            dispatch(actions.selectPane(id))
        }
    }
}

// Exports
export { Dock, Button }
export default connect(mapStateToProps, mapDispatchToProps)(Dock)
