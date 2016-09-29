/**
 * Font-Awesome module.
 * @module
 */

// React
import React from 'react'

/**
 * Communication component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Icon extends React.Component {
    /**
     * @type {Object}
     * @member module:components/font-awesome~Icon.prototype#props
     * @property {String} name Icon name (without fa- prefix)
     * @property {Boolean} fw If true display fixed width icon.
     */

    /**
     * Return the icon class name from props.
     * @return {String}
     */
    getClassName() {
        return 'fa fa-' + this.props.name + (this.props.fw ? ' fa-fw' : '')
    }

    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
            this.props.name ? <i className={ this.getClassName() }></i> : null
        )
    }
}


// Exports
export default Icon
