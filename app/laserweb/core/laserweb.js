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

        // Module flags
        // Possible values is [null, false, true]
        flags: {
            setup: null,
            ready: null
        },

        // Autoload the module ?
        autoload: false,

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

                // Mark module setup
                module.flags.setup = true;
            });

            // Subscribe to modules init topics
            this.sub('module.init.done', function(module) {
                console.log('init.done:', module.name, module);

                // Mark module ready
                module.flags.ready = true;
            });

            // Mark module setup
            this.flags.setup = true;
        },

        // Initialisation
        init: function() {
            // Current module
            var module = null;

            // Wait until all modules are setup
            for (var name in this.modules) {
                // Current module
                module = this.modules[name];

                // Skiped modules
                if (! module.autoload) {
                    continue;
                }

                // If at least one module was not setup
                if (! this.modules[name].flags.setup) {
                    // Retry later and return the timer id
                    return setTimeout(function() {
                        root.laserweb.init();
                    }, 100);
                }
            }

            // Modules initialization
            for (var name in this.modules) {
                // Skip core modules
                if (name === 'core' || name === 'module') {
                    continue;
                }

                // Load the module
                this.load_module(name);
            }

            // Mark laserweb ready
            this.flags.ready = true;

            // debug...
            console.log('READY:', this);
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

            // Set module flags
            module.flags.setup = false;

            // Setup the module
            module.setup();
        },

        // Load a module (once)
        load_module: function(name) {
            // Module not defined
            if (! this.modules[name]) {
                throw 'Module [' + name + '] not found.';
            }

            // Module
            var module = this.modules[name];

            // Module already loaded
            if (module.flags.ready !== null) {
                throw 'Module [' + name + '] already loaded.';
            }

            // Set module flags
            module.flags.ready = false;

            // Initialize the module
            module.init();
        }
    });

})(window);
