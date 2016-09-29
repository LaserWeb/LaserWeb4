/**
 * Communication module.
 * @module
 */

// React
import React from 'react'

// Main components
import Serial from './com/serial'
import Network from './com/network'

/**
 * Communication component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Com extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div>
                <Serial />
                <Network />
            </div>
        )
    }
}

// Exports
export default Com
