import { Pane } from '../../pane/pane'

/**
* LaserWeb gcode module.
*
* Description...
*/
export class GCode extends Pane {
    constructor() {
        super('layout.panes.gcode', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'GCode'

    // Module icon
    icon = 'file-code-o'
}
