import Pane from '../../pane/pane'

/**
* LaserWeb quote module.
*
* Description...
*/
export default class Quote extends Pane {
    constructor() {
        super('layout.panes.quote', '0.0.1')
    }

    // Autoload the module ?
    autoload = true

    // Module version
    version = '0.0.1'

    // Module title
    title = 'Quote'

    // Module icon
    icon = 'money'
}
