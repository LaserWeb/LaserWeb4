;(function(lw) {

    /**
    * LaserWeb layout module.
    *
    * Description...
    */
    lw.add_module('layout', {

        // Module version
        version: '0.0.1',

        // Setup module
        setup: function() {
            // Register ui elements
            this.$.dock      = $('#dock');
            this.$.panes     = $('#panes');
            this.$.workspace = $('#workspace');

            // Notify module setup is done.
            this.pub('module.setup.done');
        }

    });

})(laserweb);
