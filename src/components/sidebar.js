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
     */

    constructor(props) {
        super(props);
        
        this.state={
            visible:true
        }
        
        this.handleChange = this.handleChange.bind(this);
    }
     
     
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div id="sidebar" className={"full-height "+ (this.state.visible ? "" : "folded")} >
                <Dock>{this.props.children}</Dock>
                <Panes ref="panes" onVisibleChange={this.handleChange} >{this.props.children}</Panes>
            </div>
        )
    }
    
    handleChange(e) {
       this.setState({visible: e});
    }

}

export default Sidebar
