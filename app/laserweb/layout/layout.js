import { Module } from '../core/module'

/**
* LaserWeb layout module.
*
* Description...
*/
export class Layout extends Module {
    constructor() {
        super('Layout', '0.0.1')

        // Autoload the module ?
        this.autoload = true
    }

    // Setup module
    setup() {
        // Register ui elements
        this.$.dock      = $('#dock');
        this.$.panes     = $('#panes');
        this.$.workspace = $('#workspace');

        this.sub('layout.dock.add', this, this.on_dock_add);
        this.sub('layout.dock.set_active', this, this.on_dock_set_active);

        // Notify module setup is done.
        this.pub('module.setup.done');
    }

    on_dock_add(pane) {
        console.log('on_dock_add: ', pane.name)
        this.$.dock.append(pane.$.dock);
    }

     on_dock_set_active(pane) {
        console.log('on_dock_set_active: ', pane.name)

        // Remove active class on all children
        this.$.dock.children('.active').removeClass('active');

        // Add active class on current entry
        pane.$.dock.addClass('active');
    }
}
