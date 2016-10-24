/**
 * LaserWeb main module (layout).
 * - Create the main layout.
 * - Set initial state.
 * @module
 */

// Styles/Fonts
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import '../styles/index.css'

import ReactDOM from 'react-dom'

import 'jquery-resizable-dom/dist/jquery-resizable.js'

// React/Redux
import React from 'react'

// Main components
import Sidebar from './sidebar'
import Workspace from './workspace'

// Inner components
import Com from './com'
import Jog from './jog'
import Cam from './cam'
import Gcode from './gcode'
import Quote from './quote'
import Settings from './settings'
import About from './about'

/**
 * LaserWeb main component (layout).
 * - Create the main layout.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class LaserWeb extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div className="full-height splitpane">
                <Sidebar ref="sidebar">
                    <Com id="com" title="Communication" icon="plug" />
                    <Jog id="jog" title="Jog" icon="arrows-alt" />
                    <Cam id="cam" title="CAM" icon="pencil-square-o" />
                    <Gcode id="gcode" title="G-Code" icon="file-code-o" />
                    <Quote id="quote" title="Quote" icon="money" />
                    <Settings id="settings" title="Settings" icon="cogs" />
                    <About id="about" title="About" icon="question" />
                </Sidebar>
                <div className="splitter"></div>
                <Workspace />
            </div>
        )
    }
    
    componentDidMount()
    {
        this._splitpane();
    }
    
    _splitpane() {
        var self=ReactDOM.findDOMNode(this.refs.sidebar);
        $(self).resizable({
          handleSelector: $(self).siblings(".splitter"),
          resizeHeight: false
        })
    }
   
    
}

// Exports
export default LaserWeb
