import { Core } from './core'

/**
* LaserWeb global namespace.
*
* All stuff related to LaserWeb must be set in this scope.
*/
export class LaserWeb extends Core {

    constructor() {
        super('laserweb', '0.4.0')
    }

    // Modules collection
    modules = { }

    // Setup
    setup() {
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
    }

    // Check if all module has the flag in one state
    all_module_has_flag(flag, state) {
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
    }

    // Initialisation
    init() {
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
    }

    // Wait until all modules are ready
    ready() {
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
    }

    // Add a module (once)
    add_module(module, name) {
        name = module.name

        // Module has no name
        if (typeof module !== 'object') {
            this.error('Module [' + name + '] must be an object.');
        }

        // Module already defined
        if (this.modules[name]) {
            this.error('Module [' + name + '] already defined.');
        }

        // Add extended module to collection
        this.modules[name] = module;

        // Set module flags
        module.flags.setup = false;

        // Setup the module
        module.setup();
    }

    // Load a module (once)
    load_module(name) {
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
    }

    // Return a module
    get_module(name) {
        return this.modules[name] || undefined;
    }
}
