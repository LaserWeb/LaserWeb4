import Pane from '../../pane/pane'

/**
* LaserWeb about module.
*
* Description...
*/
export default class About extends Pane {
    constructor() {
        super('layout.panes.about', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'About'

    // Module icon
    icon = 'question'
}