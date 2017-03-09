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

import { keyboardUndoAction } from '../actions/laserweb';

import keydown, { Keys } from 'react-keydown';
import keyboardJS from 'keyboardjs'

import { fireMacroByKeyboard } from '../actions/macros'

import { GlobalStore } from '../index'

import { VideoCapture } from '../lib/video-capture'

 var vex = require('vex-js/src/vex.js')
try{ vex.registerPlugin(require('vex-dialog/src/vex.dialog.js'))} catch(e){}
        vex.defaultOptions.className = 'vex-theme-default'
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-default.css';

/**
 * LaserWeb main component (layout).
 * - Create the main layout.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */

export const confirm = (message, callback) => {
        vex.dialog.confirm({message,callback})
}

export const prompt = (message, placeholder, callback) => {
        
        vex.dialog.open({
            message,
            input: `<input name="prompt" type="text" placeholder="${placeholder}" value="${placeholder}"required />`,
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'Ok' }),
                $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
            ],
            callback: function (data) {
                if (!data) {
                    callback(null)
                } else {
                   callback(data.prompt)
                }
            }
        })
}

export const alert = (unsafeMessage) => {
        vex.dialog.alert({unsafeMessage})
}

class LaserWeb extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.documents !== this.props.documents;
    }

    componentDidMount() {

        if (!window.keyboardLogger) {
            window.keyboardLogger = keyboardJS;
            let that = this
            window.keyboardLogger.bind(['command + z', 'ctrl + z'], function (e) {
                that.props.handleUndo(e);
            });

            window.keyboardLogger.bind(Object.keys(that.props.macros), function (e) {
                that.props.handleMacro(e, that.props.macros)
            })
        }

        if (!window.videoCapture) {
            const onNextFrame = (callback) => { setTimeout(() => { window.requestAnimationFrame(callback) }, 0) }
            onNextFrame(() => {
                window.videoCapture = new VideoCapture()
                window.videoCapture.scan(this.props.settings.toolVideoDevice, this.props.settings.toolVideoResolution, (obj) => { this.props.handleVideoStream(obj) })
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
        handleUndo: evt => {
            evt.preventDefault();
            dispatch(keyboardUndoAction(evt))
        },
        handleMacro: (evt, macros) => {
            let macroAction = fireMacroByKeyboard(evt, macros)
            if (macroAction) {
                evt.preventDefault();
                dispatch(macroAction)
            }
        },
        handleVideoStream: (props) => {
            //console.log(props)
        }

    }
}

// Exports
export { LaserWeb }
export default connect(mapStateToProps, mapDispatchToProps)(LaserWeb)
