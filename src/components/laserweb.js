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
import 'react-select/dist/react-select.css';
import '../styles/index.css'
import '../styles/resizer.css';
import 'bootstrap-range-input/dist/css/bootstrap-range-input.min.css'

import ReactDOM from 'react-dom'

// React/Redux
import React from 'react'
import { connect } from 'react-redux'

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

import { AllowCapture } from './capture'
import { DocumentCacheHolder } from './document-cache'

import {keyboardUndoAction} from '../actions/laserweb';

import keydown, { Keys } from 'react-keydown';

import {fireMacroByKeyboard} from '../actions/macros'

import {GlobalStore} from '../index'

import { VideoCapture } from '../lib/video-capture'

/**
 * LaserWeb main component (layout).
 * - Create the main layout.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */


class LaserWeb extends React.Component {

    @keydown('ctrl+z')
    keylogger( event ) {
        this.props.handleKeypress(event);
    }

    @keydown(Object.keys(GlobalStore().getState().macros))
    macro(event) {
        this.props.handleMacro(event, this.props.macros)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.documents !== this.props.documents;
    }

    componentDidMount()
    {
        if (!window.videoCapture){
            const onNextFrame = (callback) => {setTimeout(()=>{window.requestAnimationFrame(callback)}, 0)}
            onNextFrame(()=>{
                window.videoCapture = new VideoCapture()
                window.videoCapture.scan(this.props.settings.toolVideoDevice, this.props.settings.toolVideoResolution, (obj)=>{this.props.handleVideoStream(obj)})
            })
        }
    }

    render() {
        // 2017-01-21 Pvdw - removed the following from Dock
        // <Gcode id="gcode" title="G-Code" icon="file-code-o" />
        // <Quote id="quote" title="Quote" icon="money" />
        return (
            <AllowCapture style={{ height: '100%' }}>
                <DocumentCacheHolder style={{ width: '100%' }} documents={this.props.documents}>
                    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <Sidebar ref="sidebar" style={{ flexGrow: 0, flexShrink: 0 }}>
                            <Cam id="cam" title="CAM" icon="pencil-square-o" />
                            <Com id="com" title="Comms" icon="plug" />
                            <Jog id="jog" title="Jog" icon="arrows-alt" />
                            <Settings id="settings" title="Settings" icon="cogs" />
                            <About id="about" title="About" icon="question" />
                        </Sidebar>
                        <Workspace style={{ flexGrow: 1 }} />
                    </div>
                </DocumentCacheHolder>
            </AllowCapture>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        macros: state.macros,
        visible: state.panes.visible,
        documents: state.documents,
        settings: state.settings,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
         handleKeypress: e => {
            if (e.key=='z' && e.ctrlKey)
                dispatch(keyboardUndoAction(e))
         },
         handleMacro: (e, macros) =>{
                dispatch(fireMacroByKeyboard(e,macros))
         },
         handleVideoStream: (props) =>{
             //console.log(props)
         }

    }
}

// Exports
export { LaserWeb }
export default connect(mapStateToProps, mapDispatchToProps)(LaserWeb)
