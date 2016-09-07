;(function(lw) {

    /**
    * LaserWeb com module.
    *
    * Description...
    */
    lw.add_module('layout.panes.com', {

        // Autoload the module ?
        autoload: true,

        // Module version
        version: '0.0.1',

        // Module title
        title: 'Communication',

        // Module icon
        icon: 'plug',

        // Extends
        extends: ['layout.pane'],

        // Has template (null, false, true or template path)
        has_template: true,

        // Socket connection (socket.io)
        socket: null,

        // Serial interface (socket wrapper)
        serial: null,

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
            // Debug level
            this.debug_level.all = true;

            // Add the dock
            this.add_dock();

            // Add the pane
            this.add_pane();

            // Set dock active
            this.set_dock_active(true);

            // Load module pane template
            this.load_pane_template();

            // Load stored settings
            this.load_settings();

            // Bind the model
            this.bind_model();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Load the module pane template
        load_pane_template: function() {
            // Get module pane template
            var pane_template = lw.get_template('layout-com-pane');

            // Add pane template to pane container
            this.$.pane.append(pane_template());
        },

        // Load stored settings
        load_settings: function() {
            // Get stored settings or empty object
            var store = this.store('serial') || {};

            // Defaults settings
            var settings = {
                port     : null,
                baud_rate: null
            };

            // Extends defaults settings with the stored settings
            $.extend(true, settings, store);

            // Store the new settings
            this.store('serial', settings);
        },

        // Bind model
        bind_model: function() {
            // Init pane model data
            this.selected_interface   = ko.observable(lw.libs.com.interfaces[0]);
            this.available_interfaces = ko.observableArray(lw.libs.com.interfaces);

            this.selected_serial_baud_rate   = ko.observable(this.store('serial').baud_rate);
            this.available_serial_baud_rates = ko.observableArray(lw.libs.com.serial.baud_rates);

            this.serial_interface_available = ko.observable(false);
            this.selected_serial_port       = ko.observable();
            this.available_serial_ports     = ko.observableArray();

            this.terminal_logs         = ko.observableArray();
            this.terminal_command_line = ko.observable('');

            this.connected       = ko.observable(false);
            this.wait_connection = ko.observable(false);

            // Self alias
            var self = this;

            // If we can connect ?
            this.can_connect = ko.computed(function() {
                // If already connected or waiting for a connection
                if (self.connected() || self.wait_connection()) {
                    return false;
                }

                // If serial interface selected
                if (self.selected_interface() === 'Serial') {
                    // True if the port is selected...
                    return !!self.selected_serial_port();
                }

                // If HTTP interface selected
                if (self.selected_interface() === 'HTTP') {
                    return false; // no yet implemented...
                }

                // Return false by default
                return false;
            });

            // Get server footprint
            lw.libs.com.http.get_server_footprint(function(footprint, headers) {
                // LaserWeb server not found
                if (footprint.indexOf('LaserWebServer') !== 0) {
                    return;
                }

                // Set serial interface available
                self.serial_interface_available(true);

                // Debug message...
                self.console('debug', 'serial_interface.available');

                // Publish a message to notify all modules
                self.pub('layout.com.serial_interface.available');

                // Bind socket interface
                self.bind_socket();
            });

            // Bind pane model to the panel (DOM)
            ko.applyBindings(this, this.$.pane[0]);
        },

        // Bind socket interface
        bind_socket: function() {
            // Socket connection
            this.socket = lw.libs.com.socket.connect();

            // Serial socket wrapper
            this.serial = lw.libs.com.serial;

            // Self alias
            var self = this;

            // On error
            this.serial.on('error', function(error) {
                // Special cases
                if (error.name === 'connect') {
                    // Reset connection flags
                    self.wait_connection(false);
                    self.connected(false);
                }

                // Publish a message to notify all modules
                self.pub('layout.com.serial.on.error', error);

                // Throw an error
                self.error('serial.error: ' + error.message);
            });

            this.serial.on_command(function(command) {
                // Handler name
                var name = command.name || 'undefined';

                // Command method found
                if (self['on_serial_' + name]) {
                    // Call command method with the Client scope
                    return self['on_serial_' + name].call(self, command.data || null);
                }

                // Command handler not found
                self.error('[' + name + '] serial command handler not found.');
            });

            // Refresh serial ports list
            this.refresh_serial_ports_list();
        },

        // Called when a new interface is selected
        select_interface: function(obj, evt) {
            // Debug message...
            this.console('debug', 'interface.selected', obj.selected_interface());

            // Publish a message to notify all modules
            this.pub('layout.com.interface.selected', obj.selected_interface());
        },

        // Called when an new serial baud rate is selected
        select_serial_baud_rate: function(obj, evt) {
            // Baud rate
            var baud_rate = this.selected_serial_baud_rate() || null;

            // Save selected port
            this.store('serial', { baud_rate: baud_rate });

            // Debug message...
            this.console('debug', 'serial.baud_rate.selected', baud_rate);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.baud_rate.selected', baud_rate);
        },

        // Called when an new serial port is selected
        select_serial_port: function(obj, evt) {
            // Port name
            var port = this.selected_serial_port() || null;

            // Save selected port
            this.store('serial', { port: port });

            // Debug message...
            this.console('debug', 'serial.port.selected', port);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.port.selected', port);
        },

        // Called when refresh serial port list is clicked
        refresh_serial_ports_list: function(obj, evt) {
            // Debug message...
            this.console('debug', 'serial.refresh.ports_list');

            // Publish a message to notify all modules
            this.pub('layout.com.serial.refresh.ports_list');

            // Get all available serial ports
            this.serial.command('list_ports');
        },

        // On list ports
        on_serial_list_ports: function(data) {
            // Debug message...
            this.console('debug', 'serial.on.list_ports:', data.ports);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.on.list_ports', data.ports);

            // Update the select input options
            var ports = [];

            for (var i = 0, il = data.ports.length; i < il; i++) {
                ports.push(data.ports[i].comName);
            }

            this.available_serial_ports(ports);

            // Set last port selected
            this.selected_serial_port(this.store('serial').port);
        },

        // Called on serial connect button is clicked
        serial_connect: function(obj, evt) {
            // Set wait connection flag (Disable connect button)
            this.wait_connection(true);

            // Get selected serial port/baud_rate
            var port      = this.selected_serial_port();
            var baud_rate = this.selected_serial_baud_rate();

            // Debug message...
            this.console('debug', 'serial.connect:', port, 'at', baud_rate);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.connect', port, baud_rate);

            // Send serial connect command
            this.serial.command('connect', {
                port     : port,
                baud_rate: baud_rate
            });
        },

        // On serial connect
        on_serial_connect: function(data) {
            // Debug message...
            this.console('debug', 'on.connect:', data);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.on.connect', data.port, data.baud_rate);

            // Add message to terminal logs
            this.terminal_logs.push({
                text: 'Connected to ' + data.port + ' at ' + data.baud_rate + 'BPS',
                icon: 'info',
                type: 'info'
            });

            // Reset waiting connection flag
            this.wait_connection(false);

            // Set connection flag
            this.connected(true);
        },

        // Serial disconnect
        serial_disconnect: function() {
            // Debug message...
            this.console('debug', 'disconnect');

            // Publish a message to notify all modules
            this.pub('layout.com.serial.disconnect');

            // Send serial diconnect command
            this.serial.command('disconnect');
        },

        // On serial disconnect
        on_serial_disconnect: function(data) {
            // Debug message...
            this.console('debug', 'on.disconnect:', data);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.on.disconnect', data.port, data.baud_rate);

            // Add message to terminal logs
            this.terminal_logs.push({
                text: 'Disconnected from ' + data.port,
                icon: 'warning',
                type: 'warning'
            });

            // Reset connection flag
            this.connected(false);
        },

        // On serial data
        on_serial_data: function(data) {
            // Debug message...
            this.console('debug', 'on.data:', data);

            // Publish a message to notify all modules
            this.pub('layout.com.serial.on.data', data);
        },

        // Terminal send command
        terminal_send_command: function(obj, evt) {
            // Get terminal command line (remove trailing whitespaces)
            var command_line = this.terminal_command_line().trim();

            // Debug message...
            this.console('debug', 'on.command_line:', command_line);

            // Publish a message to notify all modules
            this.pub('layout.com.on.command_line', command_line);

            // If empty, skip line...
            if (! command_line.length) {
                return;
            }

            // Reset terminal command line
            this.terminal_command_line('');

            // Send the command
            this.terminal_logs.push({
                text: command_line,
                icon: 'angle-right',
                type: 'default'
            });
        },

        // Terminal clear logs
        terminal_clear_logs: function(obj, evt) {
            // Clear the terminal logs
            this.terminal_logs.removeAll();
        }

    });

})(laserweb);
