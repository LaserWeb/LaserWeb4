<style>
#dock li.connected,
#dock li.connected:hover {
    color: #5cb85c;
}

#dock li.error,
#dock li.error:hover {
    color: #d9534f;
}

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

#http-boards .alert {
    margin: 0;
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
                    <span class="input-group-btn"></span>
                </div>
            </div>
        </div>
    </form><!-- #com-serial -->

    <form id="com-http"  data-bind="visible: selected_interface() == 'HTTP'">
        <h4>
            HTTP interface
            <a class="pull-right" role="button" data-toggle="collapse" href="#com-http-connect-info" aria-expanded="false" aria-controls="com-http-connect-info">
                <i class="fa fa-question-circle-o"></i>
            </a>
        </h4>
        <div class="info well bg-info collapse" id="com-http-connect-info">
            <strong>Alowed inputs :</strong><br />
            Single IP <code>192.168.1.100</code><br />
            Hostname <code>my.smoothie.net</code>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-wifi"></i></span>
                <input data-bind="value: http_board_address" type="text" class="form-control" placeholder="192.168.1.100" />
                <span data-bind="visible: !connected()" class="input-group-btn">
                    <button data-bind="enable: can_connect, click: http_connect" class="btn btn-sm btn-success" type="button">
                        Connect
                    </button>
                </span>
                <span data-bind="visible: connected" class="input-group-btn">
                    <button data-bind="click: http_disconnect" class="btn btn-sm btn-danger" type="button">
                        Disconnect
                    </button>
                </span>
                <span class="input-group-btn"></span>
            </div>
        </div>

        <hr />

        <h4>
            HTTP scanner
            <a class="pull-right" role="button" data-toggle="collapse" href="#com-http-scanner-info" aria-expanded="false" aria-controls="com-http-scanner-info">
                <i class="fa fa-question-circle-o"></i>
            </a>
        </h4>
        <div class="info well bg-info collapse" id="com-http-scanner-info">
            <strong>Alowed inputs :</strong><br />
            Wildcard <code>192.168.1.*</code><br />
            Single IP <code>192.168.1.100</code><br />
            IP Range <code>192.168.1.100-120</code><br />
            Hostname <code>my.smoothie.net</code><br />
            Mixed <code>192.168.1.100, my.smoothie.net</code>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                <input data-bind="value: http_scan_address" type="text" class="form-control" placeholder="192.168.1.*" />
                <span class="input-group-btn">
                    <button data-bind="visible: !http_scan_run() && !http_scan_aborted(), click: http_start_scan" class="btn btn-sm btn-success" type="button">
                        Start
                    </button>
                </span>
                <span class="input-group-btn">
                    <button data-bind="visible: http_scan_run(), click: http_pause_scan" class="btn btn-sm btn-warning" type="button">
                        Pause
                    </button>
                </span>
                <span class="input-group-btn">
                    <button data-bind="visible: http_scan_aborted(), click: http_resume_scan" class="btn btn-sm btn-success" type="button">
                        Resume
                    </button>
                </span>
                <span class="input-group-btn">
                    <button data-bind="visible: http_scan_run() || http_scan_aborted(), click: http_stop_scan" class="btn btn-sm btn-danger" type="button">
                        Stop
                    </button>
                </span>
                <span class="input-group-btn"></span>
            </div>
        </div>

        <div class="form-group" data-bind="with: http_scann_progression">
            <span class="label label-default">Total : <span data-bind="text: total">0</span></span>
            <span class="label label-info">Scanned : <span data-bind="text: scanned">0</span></span>
            <span class="label" data-bind="css: found === 0 ? 'label-danger' : 'label-success'">Found : <span data-bind="text: found">0</span></span>
        </div>

        <div class="progress">
            <div data-bind="style: { width: http_scann_percent() + '%' }" class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em;">
                <span data-bind="text: http_scann_percent() + '%'">0%</span>
            </div>
        </div>

        <hr />

        <h4>Smoothie boards</h4>
        <div class="alert alert-info" data-bind="visible: !http_addresses().length">
            <strong>No boards known at this time...</strong><br />
            Scan the network in order to discover some boards.
        </div>
        <div id="http-boards" data-bind="visible: http_boards().length, foreach: http_boards" class="panel-group" role="tablist">
            <div class="panel panel-default">
                <div class="panel-heading" role="tab">
                    <h4 class="panel-title">
                        <i data-bind="css: online ? 'text-success' : 'text-danger'" class="fa fa-fw fa-wifi"></i>
                        <span data-bind="text: address"></span>
                        <a class="pull-right" role="button" data-bind="attr: { href: '#http-board-' + id }" data-toggle="collapse" data-parent="#http-boards">
                            <i class="fa fa-chevron-down"></i>
                        </a>
                    </h4>
                </div>
                <div data-bind="attr: { id: 'http-board-' + id }" class="panel-collapse collapse" role="tabpanel">
                    <!-- ko ifnot: info -->
                    <div class="alert alert-warning">
                        <i class="fa fa-warning"></i> Board offline !
                    </div>
                    <!-- /ko -->
                    <!-- ko if: info -->
                    <div class="panel-body" data-bind="with: info">
                        <h4>Firmware</h4>
                        <strong>Build : </strong><span data-bind="text: branch">n/a</span>-<span data-bind="text: hash">n/a</span><br />
                        <strong>Date : </strong><span data-bind="text: date">n/a</span>
                        <h4>Hardware</h4>
                        <strong>MCU : </strong><span data-bind="text: mcu">n/a</span> (<span data-bind="text: clock">n/a</span>)
                    </div>
                    <!-- /ko -->
                </div>
            </div>
        </div>
        <div class="alert alert-info" data-bind="visible: http_addresses().length && http_boards().length !== http_addresses().length">
            <i class="fa fa-spinner fa-pulse fa-fw"></i>
            Loading konown boards (<span data-bind="text: http_boards().length">n/a</span> / <span data-bind="text: http_addresses().length">n/a</span>)
        </div>

    </form><!-- #com-http -->

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
