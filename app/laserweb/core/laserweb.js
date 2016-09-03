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
            all  : false,
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

        // Has template (null, false, true or template path)
        has_template: false,

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

        // Storage (local)
        // http://amplifyjs.com/api/store/
        store: function(key, data, merge) {
            // Prefix the key (first argument)
            key = 'lw.' + key;

            // Get the store
            var store = amplify.store(key);

            // Getter
            if (data === undefined) {
                return store;
            }

            // Force object if store not defined
            store = store === undefined ? {} : store;

            // Merge ? (true by default)
            merge = merge === undefined ? true : !!merge;

            // Merge object with data ?
            if (merge && typeof store === 'object' && typeof data === 'object') {
                data = $.extend(true, {}, store, data);
            }

            // Store the data
            amplify.store(key, data);
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

        // Libraries collection
        libs: {},

        // Extends
        extends: ['core'],

        // Setup
        setup: function() {
            // Self alias
            var self = this;

            // Subscribe to modules setup topics
            this.sub('module.setup.done', function(module) {
                // Debug message
                self.console('debug', 'module.setup.done:', module.name, module);

                // Mark module setup
                module.flags.setup = true;
            });

            // Subscribe to modules init topics
            this.sub('module.init.done', function(module) {
                // Debug message
                self.console('debug', 'module.init.done:', module.name, module);

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

            // Debug message
            this.console('debug', 'ready:', this);

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

            // If module has template
            if (module.has_template) {
                // Template path
                var template_path = module.has_template;

                // Get template path from module name
                if (typeof template_path !== 'string') {
                    template_path = module.name.replace(/\./g, '/') + '/template';
                }

                // Try to load the template and load the module on success
                this.load_template(template_path, function() {
                    module.setup();
                });
            }

            // Setup the module
            else {
                module.setup();
            }
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
        },

        // Load a template file
        load_template: function(path, done, fail) {
            // Debug message
            this.console('debug', 'load template:', path);

            // Template URL
            var url = 'laserweb/' + path + '.tpl';

            // Load the template
            var load = $.ajax({ url: url, dataType: 'text' });

            // Self alias
            var self = this;

            // On template loaded
            load.done(function(text) {
                // Debug message
                self.console('debug', 'loaded template:', path, $templates);

                // Extract style tags
                var $styles = $(text).filter('style');

                if ($styles.length) {
                    // Force rel and type attributes
                    $styles.attr('rel', 'stylesheet');
                    $styles.attr('type', 'text/css');

                    // Append to head
                    $('head').append('<!-- ' + url + ' -->');
                    $('head').append($styles);
                }

                // Extract template tags
                var $templates = $(text).filter('template');

                // Variables
                var id, $template;

                // For each template part...
                $templates.each(function(i, template) {
                    // Template as jquery object
                    $template = $(template);

                    // Get template id
                    id = $template.attr('id');

                    // No id found
                    if (! id) {
                        // Error message
                        self.warning('Undefined template id in ' + url);

                        // Skip this part...
                        return true;
                    }

                    // Create template element
                    $template = $('<script>').text($template.html());
                    $template.attr('type', 'text/lw-template');
                    $template.attr('id', id + '-template');

                    // Append to body
                    $('body').append($template);
                });

                // User callback (load = xhr)
                done && done.call(load);
            });

            // On template load fail
            load.fail(fail || function() {
                self.error('Template [' + this.url + '] not found.');
            });
        },

        // Get an loaded template from the DOM
        // And return an Handlebars compiled template
        get_template: function(name) {
            // Try to get the template element
            var $template = $('#' + name + '-template');

            // Not found...
            if (! $template.length) {
                return undefined;
            }

            // Compile and return the template
            return Handlebars.compile($template.text());
        }

    });

})(window);
