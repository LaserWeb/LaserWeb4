/**
* LaserWeb global namespace.
*
* All stuff related to LaserWeb must be set in this scope.
*/
var laserweb = {

    // LaserWeb version
    version: '0.4.0',

    // Modules collection
    modules: {},

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
};
