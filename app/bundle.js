'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/**
* LaserWeb core module.
*
* All LaserWeb module must extend this object.
*/
var Core = function () {
    function Core(name, version) {
        classCallCheck(this, Core);
        this.flags = {
            setup: null,
            ready: null
        };
        this.autoload = false;
        this.debug_level = {
            all: true,
            log: false,
            info: false,
            warn: false,
            debug: false,
            error: false
        };
        this.errors_log = [];

        // Module name
        this.name = name;

        // Module version
        this.version = version;
    }

    // Module flags
    // Possible values is [null, false, true]


    // Autoload the module ?


    // Debug level


    // Errors logs (list of Error object)


    createClass(Core, [{
        key: 'pub',


        // Pub/Sub wrapper
        // http://amplifyjs.com/api/pubsub/
        value: function pub() {
            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Prefix first argument (topic)
            args[0] = 'lw.' + args[0];

            // Force first argument to be the caller
            args.splice(1, 0, this);

            // Call vendor lib with custom arguments
            amplify.publish.apply(amplify, args);
        }
    }, {
        key: 'sub',
        value: function sub() {
            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Prefix first argument (topic)
            args[0] = 'lw.' + args[0];

            // Call vendor lib with custom arguments
            amplify.subscribe.apply(amplify, args);
        }

        // Console wrapper

    }, {
        key: 'console',
        value: function (_console) {
            function console(_x, _x2) {
                return _console.apply(this, arguments);
            }

            console.toString = function () {
                return _console.toString();
            };

            return console;
        }(function (type, arg) {
            // Skip if disabled
            if (!this.debug_level.all && !this.debug_level[type]) {
                return null;
            }

            // Slice arguments list to array
            var args = Array.prototype.slice.call(arguments);

            // Replace first argument with the prefixed module name
            args.splice(0, 1, 'lw.' + this.name + ':');

            // Call the console function
            console[type].apply(console, args);
        })

        // Throw an error message prefixed with the module name

    }, {
        key: 'error',
        value: function error(message) {
            // Create the error instance
            var error = new Error('lw.' + this.name + ': ' + message);

            // Log the error
            this.errors_log.push(error);

            // Finaly throw the error
            throw error;
        }
    }]);
    return Core;
}();

/**
* LaserWeb global namespace.
*
* All stuff related to LaserWeb must be set in this scope.
*/

var LaserWeb = function (_Core) {
    inherits(LaserWeb, _Core);

    function LaserWeb() {
        classCallCheck(this, LaserWeb);

        var _this = possibleConstructorReturn(this, (LaserWeb.__proto__ || Object.getPrototypeOf(LaserWeb)).call(this, 'laserweb', '0.4.0'));

        _this.modules = {};
        return _this;
    }

    // Modules collection


    createClass(LaserWeb, [{
        key: 'setup',


        // Setup
        value: function setup() {
            // Self alias
            var self = this;

            // Subscribe to modules setup topics
            this.sub('module.setup.done', function (module) {
                // Info message
                self.console('info', 'module.setup.done:', module.name, module);

                // Mark module setup
                module.flags.setup = true;
            });

            // Subscribe to modules init topics
            this.sub('module.init.done', function (module) {
                // Info message
                self.console('info', 'module.init.done:', module.name, module);

                // Mark module ready
                module.flags.ready = true;
            });

            // Mark module setup
            this.flags.setup = true;
        }

        // Check if all module has the flag in one state

    }, {
        key: 'all_module_has_flag',
        value: function all_module_has_flag(flag, state) {
            // Current module
            var module = null;

            // For each module
            for (var name in this.modules) {
                // Current module
                module = this.modules[name];

                // Skiped disabled modules
                if (!module.autoload) {
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

    }, {
        key: 'init',
        value: function init() {
            // Current module
            var module = null;

            // Wait until all modules are setup
            if (!this.all_module_has_flag('setup', true)) {
                // Retry later and return the timer id
                return setTimeout(function () {
                    root.laserweb.init();
                }, 100);
            }

            // Load all registrered modules
            for (var name in this.modules) {
                // Current module
                module = this.modules[name];

                // Skiped disabled modules
                if (!module.autoload) {
                    continue;
                }

                // Load the module
                this.load_module(name);
            }

            // Wait until all modules are ready
            this.ready();
        }

        // Wait until all modules are ready

    }, {
        key: 'ready',
        value: function ready() {
            // If all module are not loaded...
            if (!this.all_module_has_flag('ready', true)) {
                // Retry later and return the timer id
                return setTimeout(function () {
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

    }, {
        key: 'add_module',
        value: function add_module(module, name) {
            name = module.name;

            // Module has no name
            if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) !== 'object') {
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

    }, {
        key: 'load_module',
        value: function load_module(name) {
            // Module not defined
            if (!this.modules[name]) {
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

    }, {
        key: 'get_module',
        value: function get_module(name) {
            return this.modules[name] || undefined;
        }
    }]);
    return LaserWeb;
}(Core);

/**
* LaserWeb base module.
*
* All LaserWeb modules must extend this module.
*/

var Module = function (_Core) {
    inherits(Module, _Core);

    function Module(name, version) {
        classCallCheck(this, Module);

        // Module name
        var _this = possibleConstructorReturn(this, (Module.__proto__ || Object.getPrototypeOf(Module)).call(this, name, version));

        _this.name = name;

        // Module version
        _this.version = version;

        // jquery elements
        _this.$ = {};
        return _this;
    }

    // Module setup
    // Called once after the module was added.


    createClass(Module, [{
        key: 'setup',
        value: function setup() {
            // Notify module setup is done.
            this.pub('module.setup.done');
        }

        // Module initialization
        // Called once when all modules are setup.

    }, {
        key: 'init',
        value: function init() {
            // Notify module init is done.
            this.pub('module.init.done');
        }
    }]);
    return Module;
}(Core);

/**
* LaserWeb layout module.
*
* Description...
*/

var Layout = function (_Module) {
    inherits(Layout, _Module);

    function Layout() {
        classCallCheck(this, Layout);

        // Autoload the module ?
        var _this = possibleConstructorReturn(this, (Layout.__proto__ || Object.getPrototypeOf(Layout)).call(this, 'Layout', '0.0.1'));

        _this.autoload = true;
        return _this;
    }

    // Setup module


    createClass(Layout, [{
        key: 'setup',
        value: function setup() {
            // Register ui elements
            this.$.dock = $('#dock');
            this.$.panes = $('#panes');
            this.$.workspace = $('#workspace');

            this.sub('layout.dock.add', this, this.on_dock_add);
            this.sub('layout.dock.set_active', this, this.on_dock_set_active);

            // Notify module setup is done.
            this.pub('module.setup.done');
        }
    }, {
        key: 'on_dock_add',
        value: function on_dock_add(pane) {
            console.log('on_dock_add: ', pane.name);
            this.$.dock.append(pane.$.dock);
        }
    }, {
        key: 'on_dock_set_active',
        value: function on_dock_set_active(pane) {
            console.log('on_dock_set_active: ', pane.name);

            // Remove active class on all children
            this.$.dock.children('.active').removeClass('active');

            // Add active class on current entry
            pane.$.dock.addClass('active');
        }
    }]);
    return Layout;
}(Module);

/**
* LaserWeb dock module.
*
* Description...
*/

var Dock = function (_Module) {
    inherits(Dock, _Module);

    function Dock(name, version) {
        classCallCheck(this, Dock);

        // Dock icon
        var _this = possibleConstructorReturn(this, (Dock.__proto__ || Object.getPrototypeOf(Dock)).call(this, name, version));

        _this.icon = 'question';

        // Dock label
        _this.label = null;
        return _this;
    }

    // Module initialization
    // Called once when all modules are setup.


    createClass(Dock, [{
        key: "init",
        value: function init() {
            // Add the dock entry
            this.add_dock();

            // Notify module init is done.
            this.pub('module.init.done');
        }

        // Add new dock entry

    }, {
        key: "add_dock",
        value: function add_dock() {
            // Create main elements
            $.extend(this.$, {
                dock: $('<li>'),
                icon: $('<i>'),
                label: $('<span>')
            });

            // Set dock icon
            this.set_dock_icon(this.icon);

            // Set dock label
            this.set_dock_label(this.title);

            // Append icon and label to dock container
            this.$.dock.append(this.$.icon, this.$.label);

            // Notify layout to add this dock.
            this.pub('layout.dock.add', this);

            // Register events handlers/publishers
            var self = this;

            this.$.dock.on('click', function (e) {
                self.pub('layout.dock.click', e); // global message
                self.pub(self.name + '.dock.click', e); // targeted message
            });

            // Subscription...
            this.sub(self.name + '.dock.click', this, this.on_dock_click);
        }

        // Set the dock icon

    }, {
        key: "set_dock_icon",
        value: function set_dock_icon(icon) {
            // Update icon name
            this.icon = icon;

            // Update icon element
            this.$.icon.addClass('fa fa-' + this.icon);
        }

        // Set the dock label

    }, {
        key: "set_dock_label",
        value: function set_dock_label(label) {
            // Update icon name
            this.label = label;

            // Update icon element
            this.$.label.text(this.label);
        }

        // Set/Unset dock active

    }, {
        key: "set_dock_active",
        value: function set_dock_active(active) {
            // Notify layout to set this dock as active.
            this.pub('layout.dock.set_active', this);
        }

        // Called on dock click

    }, {
        key: "on_dock_click",
        value: function on_dock_click() {
            // Debug message
            this.console('debug', 'dock: clicked');

            // Set dock active
            this.set_dock_active(true);
        }
    }]);
    return Dock;
}(Module);

/**
* LaserWeb pane module.
*
* Description...
*/

var Pane = function (_Dock) {
    inherits(Pane, _Dock);

    function Pane(name, version) {
        classCallCheck(this, Pane);
        return possibleConstructorReturn(this, (Pane.__proto__ || Object.getPrototypeOf(Pane)).call(this, name, version));
    }

    return Pane;
}(Dock);

/**
* LaserWeb about module.
*
* Description...
*/

var About = function (_Pane) {
    inherits(About, _Pane);

    function About() {
        classCallCheck(this, About);

        var _this = possibleConstructorReturn(this, (About.__proto__ || Object.getPrototypeOf(About)).call(this, 'layout.panes.about', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'About';
        _this.icon = 'question';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return About;
}(Pane);

/**
* LaserWeb cam module.
*
* Description...
*/

var Cam = function (_Pane) {
    inherits(Cam, _Pane);

    function Cam() {
        classCallCheck(this, Cam);

        var _this = possibleConstructorReturn(this, (Cam.__proto__ || Object.getPrototypeOf(Cam)).call(this, 'layout.panes.cam', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'CAM';
        _this.icon = 'pencil-square-o';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return Cam;
}(Pane);

/**
* LaserWeb com module.
*
* Description...
*/

var Com = function (_Pane) {
    inherits(Com, _Pane);

    function Com() {
        classCallCheck(this, Com);

        var _this = possibleConstructorReturn(this, (Com.__proto__ || Object.getPrototypeOf(Com)).call(this, 'layout.panes.com', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'Communication';
        _this.icon = 'plug';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    createClass(Com, [{
        key: 'init',


        // Module initialization
        // Called once when all modules are setup.
        value: function init() {
            // Add the dock entry
            this.add_dock();

            // Set dock active
            this.set_dock_active(true);

            // Notify module init is done.
            this.pub('module.init.done');
        }
    }]);
    return Com;
}(Pane);

/**
* LaserWeb gcode module.
*
* Description...
*/

var GCode = function (_Pane) {
    inherits(GCode, _Pane);

    function GCode() {
        classCallCheck(this, GCode);

        var _this = possibleConstructorReturn(this, (GCode.__proto__ || Object.getPrototypeOf(GCode)).call(this, 'layout.panes.gcode', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'GCode';
        _this.icon = 'file-code-o';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return GCode;
}(Pane);

/**
* LaserWeb jog module.
*
* Description...
*/

var Jog = function (_Pane) {
    inherits(Jog, _Pane);

    function Jog() {
        classCallCheck(this, Jog);

        var _this = possibleConstructorReturn(this, (Jog.__proto__ || Object.getPrototypeOf(Jog)).call(this, 'layout.panes.jog', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'GCode';
        _this.icon = 'arrows-alt';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return Jog;
}(Pane);

/**
* LaserWeb quote module.
*
* Description...
*/

var Quote = function (_Pane) {
    inherits(Quote, _Pane);

    function Quote() {
        classCallCheck(this, Quote);

        var _this = possibleConstructorReturn(this, (Quote.__proto__ || Object.getPrototypeOf(Quote)).call(this, 'layout.panes.quote', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'Quote';
        _this.icon = 'money';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return Quote;
}(Pane);

/**
* LaserWeb settings module.
*
* Description...
*/

var Settings = function (_Pane) {
    inherits(Settings, _Pane);

    function Settings() {
        classCallCheck(this, Settings);

        var _this = possibleConstructorReturn(this, (Settings.__proto__ || Object.getPrototypeOf(Settings)).call(this, 'layout.panes.settings', '0.0.1'));

        _this.autoload = true;
        _this.version = '0.0.1';
        _this.title = 'Settings';
        _this.icon = 'cogs';
        return _this;
    }

    // Autoload the module ?


    // Module version


    // Module title


    // Module icon


    return Settings;
}(Pane);

var laserWeb = new LaserWeb();
laserWeb.setup();

// Add modules to LaserWeb
laserWeb.add_module(new Layout());
laserWeb.add_module(new Cam());
laserWeb.add_module(new Com());
laserWeb.add_module(new GCode());
laserWeb.add_module(new Jog());
laserWeb.add_module(new Quote());
laserWeb.add_module(new Settings());
laserWeb.add_module(new About());

// Initialize LaserWeb
laserWeb.init();