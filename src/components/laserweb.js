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

// React/Redux
import React from 'react'
import { createStore } from 'redux'
import { Provider, connect } from 'react-redux'
import reducers from '../reducers'

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

// Create redux store
let store = createStore(reducers)

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
            <Provider store={store}>
                <div className="full-height">
                    <Sidebar>
                        <Com id="com" title="Communication" icon="plug" />
                        <Jog id="jog" title="Jog" icon="arrows-alt" />
                        <Cam id="cam" title="CAM" icon="pencil-square-o" />
                        <Gcode id="gcode" title="G-Code" icon="file-code-o" />
                        <Quote id="quote" title="Quote" icon="money" />
                        <Settings id="settings" title="Settings" icon="cogs" />
                        <About id="about" title="About" icon="question" />
                    </Sidebar>
                    <Workspace />
                </div>
            </Provider>
        )
    }
}

// Exports
export default LaserWeb
