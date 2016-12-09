/**
 * Jog module.
 * @module
 */

// React
import React from 'react'

import {MacrosBar} from './macros';

/**
 * Jog component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Jog extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div>
                <p>Jog panel...</p>
                
                <MacrosBar/>
            </div>
        )
    }
}

// Exports
export default Jog
