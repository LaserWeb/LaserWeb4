import { Pane } from '../../pane/pane'

/**
* LaserWeb cam module.
*
* Description...
*/
export class Cam extends Pane {
    constructor() {
        super('layout.panes.cam', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'CAM'

    // Module icon
    icon = 'pencil-square-o'
}
