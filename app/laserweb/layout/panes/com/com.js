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

        // Connected
        connected: false,

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

            // Get module pane template
            var pane_template = lw.get_template('layout-com-pane');

            // Add pane template to pane container
            this.$.pane.append(pane_template());

            // Default stored value
            var store = this.store('serial');

            if (! store) {
                this.store('serial', {
                    port     : null,
                    baud_rate: null
                });
            }

            // Bind the model
            this.bind_model();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Bind model
        bind_model: function() {
            // Init pane model data
            this.selected_interface   = ko.observable(lw.libs.com.interfaces[0]);
            this.available_interfaces = ko.observableArray(lw.libs.com.interfaces);

            this.selected_serial_baud_rate   = ko.observable(lw.libs.com.serial.baud_rate);
            this.available_serial_baud_rates = ko.observableArray(lw.libs.com.serial.baud_rates);

            this.serial_interface_available = ko.observable(false);
            this.selected_serial_port       = ko.observable();
            this.available_serial_ports     = ko.observableArray();

            // Self alias
            var self = this;

            // Get server footprint
            this.can_connect = ko.computed(function() {
                return ! self.connected && self.selected_serial_port();
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
                self.error('serial.error:', error);
            });

            this.serial.on_command(function(command) {
                // Handler name
                var name = command.name || 'undefined';

                // Command method found
                if (self['on_' + name]) {
                    // Call command method with the Client scope
                    return self['on_' + name].call(self, command.data || null);
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
        on_list_ports: function(data) {
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
        }

    });

})(laserweb);
