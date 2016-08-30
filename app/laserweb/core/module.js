;(function(lw) {

    /**
    * LaserWeb base module.
    *
    * All LaserWeb modules must extend this module.
    */
    lw.modules.module = {

        // Module version
        version: '0.0.1',

        // Module name
        name: 'module',

        // jquery elements
        $: {},

        // Module setup
        setup: function() {
            // Called once after the module was added.
        },

        // Module initialization
        init: function() {
            // Called once when all modules are setup.
        }

    };

})(laserweb);
