;(function(root) {

    /**
    * LaserWeb core module.
    *
    * All LaserWeb module must extend this object.
    */
    var core = {

        // Module version
        version: '0.0.1',

        // Module name
        name: 'core',

        // Pub/Sub wrapper
        // http://amplifyjs.com/api/pubsub/
        pub: function() {
            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Prefix first argument (topic)
            args[0] = 'lw.' + args[0];

            // Force first argument to be the caller
            args.splice(1, 0, this);

            // Call vendor lib with custom arguments
            amplify.publish.apply(amplify, args);
        },

        sub: function() {
            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Prefix first argument (topic)
            args[0] = 'lw.' +  args[0];

            // Call vendor lib with custom arguments
            amplify.subscribe.apply(amplify, args);
        }
    };

    /**
    * LaserWeb global namespace.
    *
    * All stuff related to LaserWeb must be set in this scope.
    */
    root.laserweb = $.extend(true, {}, core, {

        // LaserWeb version
        version: '0.4.0',

        // Module name
        name: 'laserweb',

        // Modules collection
        modules: {
            core: core
        },

        // Setup
        setup: function() {
            // Subscribe to modules setup topics
            this.sub('module.setup.done', function(module) {
                console.log('setup.done:', module.name, module);
            });

            // Subscribe to modules init topics
            this.sub('module.init.done', function(module) {
                console.log('init.done:', module.name, module);
            });
        },

        // Initialisation
        init: function() {
            console.log(this);
        },

        // Add a module (once)
        add_module: function(name, module) {
            // Module has no name
            if (typeof module !== 'object') {
                throw 'Module [' + name + '] must be an object.';
            }

            // Module already defined
            if (this.modules[name]) {
                throw 'Module [' + name + '] already defined.';
            }

            // Extends from core module (deep)
            module = $.extend(true, {}, this.modules.module, module);

            // Add extended module to collection
            this.modules[name] = module;

            // Force module name
            module.name = name;

            // Setup the module
            module.setup();
        }
    });

})(window);
