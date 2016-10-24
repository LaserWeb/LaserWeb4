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
import '../styles/resizer.css';

import ReactDOM from 'react-dom'

import 'jquery-resizable-dom/dist/jquery-resizable.min.js'

// React/Redux
import React from 'react'

// Main components
import Sidebar from './sidebar'
import Workspace from './workspace'

import SplitPane from 'react-split-pane/lib/SplitPane'

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
    
     constructor(props) {
        super(props);
        this.state={visible:true}
        this.handleVisibleChange = this.handleVisibleChange.bind(this);
    }
    
    
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div className={"full-height "+(this.state.visible? "":"folded")}>
            <SplitPane  split="vertical" minSize={80} maxSize="50%" defaultSize="30%">
                <Sidebar ref="sidebar" onVisibleChange={this.handleVisibleChange}>
                    <Com id="com" title="Communication" icon="plug" />
                    <Jog id="jog" title="Jog" icon="arrows-alt" />
                    <Cam id="cam" title="CAM" icon="pencil-square-o" />
                    <Gcode id="gcode" title="G-Code" icon="file-code-o" />
                    <Quote id="quote" title="Quote" icon="money" />
                    <Settings id="settings" title="Settings" icon="cogs" />
                    <About id="about" title="About" icon="question" />
                </Sidebar>
               
                <Workspace />
            </SplitPane>
            </div>
        )
     /*<div className="splitter"></div>*/
    }
    
    componentDidMount()
    {
        //this._splitpane();
    }
    
    _splitpane() {
        var self=ReactDOM.findDOMNode(this.refs.sidebar);
        $(self).resizable({
          handleSelector: '.splitpane .splitter',
          resizeHeight: false
        })
    }
    
    handleVisibleChange(e) {
        
        //if (e!=this.state.visible) {
            this.setState({visible: e});
        /*    console.log(this.state);
        }*/
       
    }
   
    
}

// Exports
export default LaserWeb
