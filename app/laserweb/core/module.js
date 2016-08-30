;(function(lw) {

    /**
    * LaserWeb base module.
    *
    * All LaserWeb modules must extend this module.
    */
    lw.modules.module = $.extend(true, {}, lw.modules.core, {

        // Module version
        version: '0.0.1',

        // Module name
        name: 'module',

        // jquery elements
        $: {},

        // Extends
        extends: ['core'],

        // Module setup
        // Called once after the module was added.
        setup: function() {
            // Notify module setup is done.
            this.pub('module.setup.done');
        },

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
            // Notify module init is done.
            this.pub('module.init.done');
        }

    });

})(laserweb);
