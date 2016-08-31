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

        // Module initialization
        // Called once when all modules are setup.
        init: function() {
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

            // Bind the model
            this.bind_model();

            // Notify module init is done.
            this.pub('module.init.done');
        },

        // Bind model
        bind_model: function() {
            // Get some initial data for the pane model...
            // !!! This kinds of data have to be obtained via an external resource (libs/class/api/etc...).
            // This is just for the test example.
            var available_interfaces        = ['Serial', 'Network'];
            var available_serial_baud_rates = [250000,230400,115200,57600,38400,19200,9600];
            var available_serial_ports      = [];

            // Init pane model data
            this.selected_interface   = ko.observable(available_interfaces[0]);
            this.available_interfaces = ko.observableArray(available_interfaces);

            this.selected_serial_baud_rate   = ko.observable(115200);
            this.available_serial_baud_rates = ko.observableArray(available_serial_baud_rates);

            this.selected_serial_port   = ko.observable(available_serial_ports[0]);
            this.available_serial_ports = ko.observableArray(available_serial_ports);

            // Bind pane model to the panel (DOM)
            ko.applyBindings(this, this.$.pane[0]);
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
            // Debug message...
            this.console('debug', 'serial.baud_rate.selected', obj.selected_serial_baud_rate());
            // Publish a message to notify all modules
            this.pub('layout.com.serial.baud_rate.selected', obj.selected_serial_baud_rate());
        },

        // Called when an new serial port is selected
        select_serial_port: function(obj, evt) {
            // Debug message...
            this.console('debug', 'serial.port.selected', obj.selected_serial_port());
            // Publish a message to notify all modules
            this.pub('layout.com.serial.port.selected', obj.selected_serial_port());
        },

        // Called when refresh serial port list is clicked
        refresh_serial_ports_list: function(obj, evt) {
            // Debug message...
            this.console('debug', 'serial.refresh.ports_list');
            // Publish a message to notify all modules
            this.pub('layout.com.serial.refresh.ports_list');
        }

    });

})(laserweb);
