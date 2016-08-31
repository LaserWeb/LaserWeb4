import { Pane } from '../../pane/pane'

/**
* LaserWeb jog module.
*
* Description...
*/
export class Jog extends Pane {
    constructor() {
        super('layout.panes.jog', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'Jog'

    // Module icon
    icon = 'arrows-alt'
}
