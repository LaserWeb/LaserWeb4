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

        // Debug level
        debug_level: {
            all  : true,
            log  : false,
            info : false,
            warn : false,
            debug: false,
            error: false
        },

        // Extends
        extends: ['object'],

        // Errors logs (list of Error object)
        errors_log: [],

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
        },

        // Console wrapper
        console: function(type, arg) {
            // Skip if disabled
            if (! this.debug_level.all && ! this.debug_level[type]) {
                return null;
            }

            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Replace first argument with the prefixed module name
            args.splice(0, 1, 'lw.' +  this.name + ':');

            // Call the console function
            console[type].apply(console, args);
        },

        // Throw an error message prefixed with the module name
        error: function(message) {
            // Create the error instance
            var error = new Error('lw.' +  this.name + ': ' + message);

            // Log the error
            this.errors_log.push(error);

            // Finaly throw the error
            throw error;
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

        // Extends
        extends: ['core'],

        // Setup
        setup: function() {
            // Self alias
            var self = this;

            // Subscribe to modules setup topics
            this.sub('module.setup.done', function(module) {
                // Info message
                self.console('info', 'module.setup.done:', module.name, module);

                // Mark module setup
                module.flags.setup = true;
            });

            // Subscribe to modules init topics
            this.sub('module.init.done', function(module) {
                // Info message
                self.console('info', 'module.init.done:', module.name, module);

                // Mark module ready
                module.flags.ready = true;
            });

            // Mark module setup
            this.flags.setup = true;
        },

        // Check if all module has the flag in one state
        all_module_has_flag: function(flag, state) {
            // Current module
            var module = null;

            // For each module
            for (var name in this.modules) {
                // Current module
                module = this.modules[name];

                // Skiped disabled modules
                if (! module.autoload) {
                    continue;
                }

                // If at least one module is not in the desired state
                if (module.flags[flag] !== state) {
                    return false;
                }
            }

            // All modules is in the desired state
            return true;
        },

        // Initialisation
        init: function() {
            // Current module
            var module = null;

            // Wait until all modules are setup
            if (! this.all_module_has_flag('setup', true)) {
                // Retry later and return the timer id
                return setTimeout(function() {
                    root.laserweb.init();
                }, 100);
            }

            // Load all registrered modules
            for (var name in this.modules) {
                // Current module
                module = this.modules[name];

                // Skiped disabled modules
                if (! module.autoload) {
                    continue;
                }

                // Load the module
                this.load_module(name);
            }

            // Wait until all modules are ready
            this.ready();
        },

        // Wait until all modules are ready
        ready: function() {
            // If all module are not loaded...
            if (! this.all_module_has_flag('ready', true)) {
                // Retry later and return the timer id
                return setTimeout(function() {
                    root.laserweb.ready();
                }, 100);
            }

            // Already ready
            if (this.flags.ready) {
                return null; // exit...
            }

            // If error...
            if (this.errors_log.length) {
                // Notify all modules
                this.pub('laserweb.error', this.errors_log);

                // Exit...
                return null;
            }

            // Mark laserweb ready
            this.flags.ready = true;

            // Info message
            this.console('info', 'ready:', this);

            // Notify all modules laserweb is ready.
            this.pub('laserweb.ready');
        },

        // Add a module (once)
        add_module: function(name, module) {
            // Module has no name
            if (typeof module !== 'object') {
                this.error('Module [' + name + '] must be an object.');
            }

            // Module already defined
            if (this.modules[name]) {
                this.error('Module [' + name + '] already defined.');
            }

            // Extends list
            var extends_list  = [];
            var extend_name   = null;
            var extend_object = null;

            for (var i = 0, il = module.extends.length; i < il; i++) {
                // Module name or object
                extend_name   = module.extends[i];
                extend_object = extend_name;

                // If module name
                if (typeof extend_name === 'string') {
                    // Get the module object
                    extend_object = this.get_module(extend_name);

                    // Module not defined
                    if (! extend_object) {
                        this.error('Module [' + extend_name + '] not found.');
                    }
                }

                // Add modules to extends list
                extends_list.push(extend_object);
            }

            // If the extends list is empty
            if (! extends_list.length) {
                // Add the core module
                extends_list.push(this.modules.module);
            }

            // Push current module at the and of the list
            extends_list.push(module);

            // Push the two first arguments for '$.extend.apply'
            extends_list.unshift(true, {});

            // Extend the module
            module = $.extend.apply($, extends_list);

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
                this.error('Module [' + name + '] not found.');
            }

            // Module
            var module = this.modules[name];

            // Module already loaded
            if (module.flags.ready !== null) {
                this.error('Module [' + name + '] already loaded.');
            }

            // Set module flags
            module.flags.ready = false;

            // Initialize the module
            module.init();
        },

        // Return a module
        get_module: function(name) {
            return this.modules[name] || undefined;
        }

    });

})(window);
