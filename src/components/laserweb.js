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

import {fireMacro} from '../actions/macros'

import {GlobalStore} from '../index'

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
    
    render() {
        return (
            <AllowCapture style={{ height: '100%' }}>
                <DocumentCacheHolder style={{ width: '100%' }} documents={this.props.documents}>
                    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <Sidebar ref="sidebar" style={{ flexGrow: 0 }}>
                            <Com id="com" title="Communication" icon="plug" />
                            <Jog id="jog" title="Jog" icon="arrows-alt" />
                            <Cam id="cam" title="CAM" icon="pencil-square-o" />
                            <Gcode id="gcode" title="G-Code" icon="file-code-o" />
                            <Quote id="quote" title="Quote" icon="money" />
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
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
         handleKeypress: e => {
            if (e.key=='z' && e.ctrlKey)
                dispatch(keyboardUndoAction(e))
         },
         handleMacro: (e, macros) =>{
                dispatch(fireMacro(e,macros))
         }
        
    }
}

// Exports
export { LaserWeb }
export default connect(mapStateToProps, mapDispatchToProps)(LaserWeb)

