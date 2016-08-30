/**
* LaserWeb core module.
*
* All LaserWeb module must extend this object.
*/
export default class Core {
    constructor(name, version) {
        // Module name
        this.name = name

        // Module version
        this.version = version
    }

    // Module flags
    // Possible values is [null, false, true]
    flags = {
        setup: null,
        ready: null
    }

    // Autoload the module ?
    autoload = false

    // Debug level
    debug_level = {
        all  : true,
        log  : false,
        info : false,
        warn : false,
        debug: false,
        error: false
    }

    // Errors logs (list of Error object)
    errors_log = []

    // Pub/Sub wrapper
    // http://amplifyjs.com/api/pubsub/
    pub() {
        // Slice arguments list to array
        var args = Array.prototype.slice.call(arguments);

        // Prefix first argument (topic)
        args[0] = 'lw.' + args[0];

        // Force first argument to be the caller
        args.splice(1, 0, this);

        // Call vendor lib with custom arguments
        amplify.publish.apply(amplify, args);
    }

    sub() {
        // Slice arguments list to array
        var args = Array.prototype.slice.call(arguments);

        // Prefix first argument (topic)
        args[0] = 'lw.' +  args[0];

        // Call vendor lib with custom arguments
        amplify.subscribe.apply(amplify, args);
    }

    // Console wrapper
    console(type, arg) {
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
    }

    // Throw an error message prefixed with the module name
    error(message) {
        // Create the error instance
        var error = new Error('lw.' +  this.name + ': ' + message);

        // Log the error
        this.errors_log.push(error);

        // Finaly throw the error
        throw error;
    }
}