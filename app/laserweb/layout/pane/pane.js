;(function(lw) {

    /**
    * LaserWeb pane module.
    *
    * Description...
    */
    lw.add_module('layout.pane', {

        // Module version
        version: '0.0.1',

        // Extends
        extends: ['layout.dock'],

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
            // Add the dock entry
            this.add_dock();

            // Add the pane
            this.add_pane();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Add the pane
        add_pane: function() {
            // Create main elements
            $.extend(this.$, {
                pane: $('<div>')
            });

            // Panel setup
            this.$.pane.hide();
            this.$.pane.addClass('dock-pane');

            // Append the pane to the layout panes container
            var $panes = lw.get_module('layout').$.panes;
            $panes.append('<!-- ' + this.name + '.$.pane -->');
            $panes.append(this.$.pane);
            $panes.append('<!-- /' + this.name + '.$.pane -->');
        },

        // Set/Unset dock active
        set_dock_active: function(active) {
            // Get the layout module
            var layout = lw.get_module('layout');

            // Get dock width as workspace width offset
            var width_offset = layout.$.dock.outerWidth();

            // If the panel is allready visible
            if (this.$.pane.is(':visible')) {
                // Hide the panes container
                layout.$.panes.hide();
            }
            else {
                // Remove active class on active dock
                layout.$.dock.children('.active').removeClass('active');

                // Hide all panes
                layout.$.panes.children('.dock-pane').hide();

                // Add active class on current dock
                this.$.dock.addClass('active');

                // Show new active pane
                this.$.pane.show();

                // Add panes width to workspace width offset
                width_offset += layout.$.panes.outerWidth();

                // Show panels container
                layout.$.panes.show();
            }

            // Calculate new workspace width
            layout.$.workspace.css('width', 'calc(100% - ' + width_offset + 'px)');
        }

    });

})(laserweb);
