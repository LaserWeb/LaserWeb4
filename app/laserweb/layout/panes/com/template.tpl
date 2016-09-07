<style>
#com-terminal-logs {
    overflow-x: auto;
    overflow-y: scroll;
    resize: vertical;
    height: 100px;
}

#com-terminal-logs .log-line {
    display: flex;
    padding: 2px 5px;
    font-size: 0.8em;
    border-bottom: 1px #ccc solid;
}

#com-terminal-logs .log-line i {
    margin-right: 2px;
}

.input-group-btn .btn {
    border: 1px #ccc solid;
}
</style>

<template id="layout-com-pane">

    <form id="com-interface">
        <h4>Interfaces</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-plug"></i></span>
                <select class="form-control" data-bind="enable: can_connect, options: available_interfaces, value: selected_interface, event: { change: select_interface }"></select>
            </div>
        </div>
    </form><!-- #com-interface -->

    <hr />

    <form id="com-serial" data-bind="visible: selected_interface() == 'Serial'">
        <div class="panel panel-danger" data-bind="visible: !serial_interface_available()">
            <div class="panel-heading">
                <h3 class="panel-title">Unavailable serial interface !</h3>
            </div>
            <div class="panel-body">
                <p>
                    <strong>You need serial communication ?</strong> Please install the LaserWeb server from the
                    <a href="https://github.com/openhardwarecoza/LaserWeb4">LaserWeb4</a> git repository.
                </p>
            </div>
        </div>
        <div data-bind="visible: serial_interface_available()">
            <h4>Serial interface</h4>
            <div class="form-group">
                <div class="input-group input-group-sm">
                    <span class="input-group-addon"><i class="fa fa-usb"></i></span>
                    <select class="form-control" data-bind="enable: can_connect, optionsCaption: 'Select a port...', options: available_serial_ports, value: selected_serial_port, event: { change: select_serial_port }"></select>
                    <span class="input-group-btn">
                        <button class="btn btn-sm btn-secondary" type="button" data-bind="enable: can_connect, click: refresh_serial_ports_list">
                            <i class="fa fa-refresh"></i>
                        </button>
                    </span>
                </div>
            </div>
            <div class="form-group">
                <div class="input-group input-group-sm">
                    <span class="input-group-addon"><i class="fa fa-tty"></i></span>
                    <select class="form-control" data-bind="enable: can_connect, options: available_serial_baud_rates, value: selected_serial_baud_rate, event: { change: select_serial_baud_rate }"></select>
                    <span data-bind="visible: !connected()" class="input-group-btn">
                        <button data-bind="enable: serial_can_connect, click: serial_connect" class="btn btn-sm btn-success" type="button">
                            Connect
                        </button>
                    </span>
                    <span data-bind="visible: connected" class="input-group-btn">
                        <button data-bind="click: serial_disconnect" class="btn btn-sm btn-danger" type="button">
                            Disconnect
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </form><!-- #com-serial -->

    <form id="com-network"  data-bind="visible: selected_interface() == 'HTTP'">
        <h4>HTTP interface</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-wifi"></i></span>
                <input type="text" class="form-control" maxlength="16" placeholder="192.168.1.*" />
                <span class="input-group-btn">
                    <button class="btn btn-sm btn-info" type="button">
                        Scan
                    </button>
                    <button class="btn btn-sm btn-success" type="button">
                        Connect
                    </button>
                </span>
            </div>
        </div>
    </form><!-- #com-network -->

    <form id="com-new-interface"  data-bind="visible: selected_interface() == 'My new interface'">
        <h4>My new interface</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-wifi"></i></span>
                <input type="text" class="form-control" maxlength="16" placeholder="192.168.1.*" />
                <span class="input-group-btn">
                    <button class="btn btn-sm btn-success" type="button">
                        Connect
                    </button>
                    <button class="btn btn-sm btn-info" type="button">
                        Scan
                    </button>
                </span>
            </div>
        </div>
    </form><!-- #com-new-interface -->

    <hr />

    <div id="com-terminal">
        <h4>Terminal</h4>
        <div id="com-terminal-logs" class="panel panel-default" data-bind="foreach: terminal_logs">
            <div class="log-line" data-bind="css: 'bg-' + type + ' text-' + type">
                <div>
                    <i class="fa fa-fw" data-bind="visible: icon, css: 'fa-' + icon"></i>
                </div>
                <div>
                    <span class="text" data-bind="text: text"></span>
                </div>
            </div>
        </div>
        <form data-bind="submit: terminal_send_command">
            <div class="form-group">
                <div class="input-group input-group-sm">
                    <span class="input-group-addon"><i class="fa fa-terminal"></i></span>
                    <input type="text" class="form-control" data-bind="value: terminal_command_line" />
                    <span class="input-group-btn">
                        <button class="btn btn-sm btn-default" type="submit">
                            <i class="fa fa-play"></i> Send
                        </button>
                        <button class="btn btn-sm btn-default" type="button" data-bind="click: terminal_clear_logs">
                            <i class="fa fa-trash"></i>
                        </button>
                    </span>
                </div>
            </div>
        </form>
    </div><!-- #com-terminal -->

</template><!-- #layout-com-pane -->
