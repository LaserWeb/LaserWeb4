/**
 * About module.
 * @module
 */

// React
import React from 'react'
import { ButtonToolbar, Button } from 'react-bootstrap'
import Icon from './font-awesome'
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
                <h3>Support</h3>
                  <Button href="https://plus.google.com/communities/115879488566665599508"><Icon name="question-circle"/>&nbsp;Google+ Community</Button>
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
