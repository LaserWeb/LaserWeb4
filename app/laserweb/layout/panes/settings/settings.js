import { Pane } from '../../pane/pane'

/**
* LaserWeb settings module.
*
* Description...
*/
export class Settings extends Pane {
    constructor() {
        super('layout.panes.settings', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'Settings'

    // Module icon
    icon = 'cogs'
}
