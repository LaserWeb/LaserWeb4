import { Pane } from '../../pane/pane'

/**
* LaserWeb com module.
*
* Description...
*/
export class Com extends Pane {
    constructor() {
        super('layout.panes.com', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'Communication'

    // Module icon
    icon = 'plug'

    // Module initialization
    // Called once when all modules are setup.
    init() {
        // Add the dock entry
        this.add_dock();

        // Set dock active
        this.set_dock_active(true);

        // Notify module init is done.
        this.pub('module.init.done');
    }    
}
