/**
* Imports
*/
var SerialPort = require('serialport');

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

    // Reset port
    this._reset();

    // Self alias
    var self = this;

    // Bind socket commands to Client methods
    this.socket.on('serial.command', function(command) {
        self.on_command(command);
    });
};

Client.prototype._reset = function() {
    this.port      = null;
    this.path      = null;
    this.baud_rate = null;
};

Client.prototype.error = function(name, message) {
    this.socket.emit('serial.error', {
        name   : name,
        message: message
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
    SerialPort.list(function(error, ports) {
        self.command('list_ports', {
            error: error,
            ports: ports
        });

        if (error) {
            self.error('list_ports', error.message);
        }
    });
};

Client.prototype.disconnect = function() {
    // No port opened
    if (! this.port) {
        return;
    }

    // Self alias
    var self = this;

    // Close port
    this.port.close(function() {
        // Send disconnect message
        self.command('disconnect', {
            port     : self.path,
            baud_rate: self.baud_rate
        });

        // Reset port
        self._reset();
    });
};

Client.prototype.connect = function(data) {
    // Self alias
    var self = this;

    // Disconnect...
    this.disconnect();

    // New SerialPort instance
    this.port = new SerialPort(data.port, {
        baudRate: data.baud_rate,
        parser  : SerialPort.parsers.readline('\n')
    });

    // On port opened
    this.port.on('open', function() {
        self.path      = data.port;
        self.baud_rate = data.baud_rate;

        self.command('connect', data);
    });

    // On port open error
    this.port.on('error', function(error) {
        self.error('connect', error.message);
        self._reset(); // Reset port
    });

    // On data received
    this.port.on('data', function(data) {
        self.command('data', data);
    });
};

Client.prototype.send = function(data) {
    // No port opened
    if (! this.port) {
        return;
    }

    this.port.write(data);
};
