import Core from './core'

/**
* LaserWeb base module.
*
* All LaserWeb modules must extend this module.
*/
export default class Module extends Core {
    constructor(name, version) {
        super(name, version)

        // Module name
        this.name = name

        // Module version
        this.version = version

        // jquery elements
        this.$ = {}
    }

    // Module setup
    // Called once after the module was added.
    setup() {
        // Notify module setup is done.
        this.pub('module.setup.done');
    }

    // Module initialization
    // Called once when all modules are setup.
    init() {
        // Notify module init is done.
        this.pub('module.init.done');
    }
}