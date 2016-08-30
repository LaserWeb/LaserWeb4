import LaserWeb from "../../core/laserweb"
import Module from "../../core/module"

/**
* LaserWeb dock module.
*
* Description...
*/
export default class Dock extends Module {
    constructor(name, version) {
        super(name, version)

        // Dock icon
        this.icon = 'question'

        // Dock label
        this.label = null
    }

    // Module initialization
    // Called once when all modules are setup.
    init() {
        // Add the dock entry
        this.add_dock();

        // Notify module init is done.
        this.pub('module.init.done');
    }

    // Add new dock entry
    add_dock() {
        // Create main elements
        $.extend(this.$, {
            dock : $('<li>'),
            icon : $('<i>'),
            label: $('<span>')
        });

        // Set dock icon
        this.set_dock_icon(this.icon);

        // Set dock label
        this.set_dock_label(this.title);

        // Append icon and label to dock container
        this.$.dock.append(this.$.icon, this.$.label);

        // Notify layout to add this dock.
        this.pub('layout.dock.add', this);

        // Register events handlers/publishers
        var self = this;

        this.$.dock.on('click', function(e) {
            self.pub('layout.dock.click', e);       // global message
            self.pub(self.name + '.dock.click', e); // targeted message
        });

        // Subscription...
        this.sub(self.name + '.dock.click', this, this.on_dock_click);
    }

    // Set the dock icon
    set_dock_icon(icon) {
        // Update icon name
        this.icon = icon;

        // Update icon element
        this.$.icon.addClass('fa fa-' + this.icon);
    }

    // Set the dock label
    set_dock_label(label) {
        // Update icon name
        this.label = label;

        // Update icon element
        this.$.label.text(this.label);
    }

    // Set/Unset dock active
    set_dock_active(active) {
        // Notify layout to set this dock as active.
        this.pub('layout.dock.set_active', this);
    }

    // Called on dock click
    on_dock_click() {
        // Debug message
        this.console('debug', 'dock: clicked');

        // Set dock active
        this.set_dock_active(true);
    }
}
