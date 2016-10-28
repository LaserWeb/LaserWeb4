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

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

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

import { AllowCapture } from './capture'
import { DocumentCacheHolder } from './document-cache'

/**
 * LaserWeb main component (layout).
 * - Create the main layout.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class LaserWeb extends React.Component {
    render() {
        return (
            <AllowCapture>
                <DocumentCacheHolder documents={this.props.documents}>
                    <SplitPane split="vertical" minSize={80} maxSize="50%" defaultSize="30%" className={"full-height " + (this.props.visible ? "" : "folded")}>
                        <Sidebar ref="sidebar">
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
                </DocumentCacheHolder>
            </AllowCapture>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        visible: state.panes.visible,
        documents: state.documents,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

// Exports
export { LaserWeb }
export default connect(mapStateToProps, mapDispatchToProps)(LaserWeb)
