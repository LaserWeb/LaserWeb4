;(function(lw) {

    /**
    * LaserWeb dock module.
    *
    * Description...
    */
    lw.add_module('layout.dock', {

        // Module version
        version: '0.0.1',

        // Extends
        extends: ['module'],

        // Dock icon
        icon: 'question',

        // Dock label
        label: null,

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
            // Add the dock entry
            this.add_dock();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Add new dock entry
        add_dock: function() {
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

            // Append the dock to the layout dock container
            lw.get_module('layout').$.dock.append(this.$.dock);
        },

        // Set the dock icon
        set_dock_icon: function(icon) {
            // Update icon name
            this.icon = icon;

            // Update icon element
            this.$.icon.addClass('fa fa-' + this.icon);
        },

        // Set the dock label
        set_dock_label: function(label) {
            // Update icon name
            this.label = label;

            // Update icon element
            this.$.label.text(this.label);
        }

    });

})(laserweb);
