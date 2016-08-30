;(function(lw) {

    /**
    * LaserWeb layout module.
    *
    * Description...
    */
    lw.add_module('layout', {

        // Autoload the module ?
        autoload: true,

        // Module version
        version: '0.0.1',

        // Extends
        extends: ['module'],

        // Setup module
        setup: function() {
            // Create main elements
            $.extend(this.$, {
                dock     : $('#dock'),
                panes    : $('#panes'),
                workspace: $('#workspace')
            });

            // Notify module setup is done.
            this.pub('module.setup.done');
        }

    });

})(laserweb);
