/**
 * About module.
 * @module
 */

// React
import React from 'react'

/**
 * About component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class About extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            <div>
                <h3>Support Community</h3>
                  
                <h3>Developers</h3>
                <ul>
                  <li>Todd Fleming</li>
                  <li>Sebastien Mischler</li>
                  <li>Jorge Robles</li>
                  <li>Peter van der Walt</li>
                </ul>

            </div>
        )
    }
}

// Exports
export default About
