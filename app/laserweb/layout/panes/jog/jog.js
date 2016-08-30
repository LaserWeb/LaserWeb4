import Pane from '../../pane/pane'

/**
* LaserWeb jog module.
*
* Description...
*/
export default class Jog extends Pane {
    constructor() {
        super('layout.panes.jog', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'GCode'

    // Module icon
    icon = 'arrows-alt'
}
