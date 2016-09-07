/**
* Imports
*/
var serialport = require('serialport');

/**
* Serial interface
*/
var serial = exports;

// Create and attach a new client
serial.attach = function(socket) {
    // Create new client
    var client = new Client(socket);
};

/**
* Client "class"
*/
var Client = function(socket) {
    // Socket ref
    this.socket = socket;

    // Self alias
    var self = this;

    // Bind socket commands to Client methods
    this.socket.on('serial.command', function(command) {
        self.on_command(command);
    });
};

Client.prototype.error = function(name, data) {
    this.socket.emit('serial.error', {
        name: name,
        data: data
    });
};

Client.prototype.command = function(name, data) {
    this.socket.emit('serial.command', {
        name: name,
        data: data
    });
};

Client.prototype.on_command = function(command) {
    // Command method found
    if (command.name && this[command.name]) {
        // Call command method with the Client scope
        return this[command.name](command.data || null);
    }

    // Not found! Emmit an error
    this.error('undefined_command', command);
};

// -----------------------------------------------------------------------------
// Commands handlers
// -----------------------------------------------------------------------------

Client.prototype.list_ports = function(data) {
    // Self alias
    var self = this;

    // List all available ports
    serialport.list(function(error, ports) {
        self.command('list_ports', {
            error: error,
            ports: ports
        });

        if (error) {
            self.error('list_ports', error);
        }
    });
};

Client.prototype.connect = function(data) {
    console.log(data);
};
