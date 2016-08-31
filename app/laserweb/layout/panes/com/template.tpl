<style>
#com-console .logs {
    overflow: auto;
    resize: vertical;
    min-height: 100px;
}

.input-group-btn .btn {
    border: 1px #ccc solid;
}
</style>

<template id="layout-com-pane">

    <form id="com-interface">
        <h4>Interface</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-plug"></i></span>
                <select class="form-control" data-bind="options: available_interfaces, value: selected_interface, event: { change: select_interface }"></select>
            </div>
        </div>
    </form><!-- #com-interface -->

    <hr />

    <form id="com-serial" data-bind="visible: selected_interface() == 'Serial'">
        <h4>Serial</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-usb"></i></span>
                <select class="form-control" data-bind="optionsCaption: 'Select a port...', options: available_serial_ports, value: selected_serial_port, event: { change: select_serial_port }"></select>
                <span class="input-group-btn">
                    <button class="btn btn-sm btn-secondary" type="button" data-bind="click: refresh_serial_ports_list">
                        <i class="fa fa-refresh"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-tty"></i></span>
                <select class="form-control" data-bind="options: available_serial_baud_rates, value: selected_serial_baud_rate, event: { change: select_serial_baud_rate }"></select>
            </div>
        </div>
        <div class="form-group">
            <button class="btn btn-block btn-success disabled" type="button">
                Connect
            </button>
        </div>
    </form><!-- #com-serial -->

    <form id="com-network"  data-bind="visible: selected_interface() == 'Network'">
        <h4>Network</h4>
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

    <div id="com-console">
        <h4>Console</h4>
        <div class="logs panel panel-default"></div>
        <form>
            <div class="form-group">
                <div class="input-group input-group-sm">
                    <span class="input-group-addon"><i class="fa fa-terminal"></i></span>
                    <input type="text" class="form-control" />
                    <span class="input-group-btn">
                        <button class="btn btn-sm btn-default" type="button">
                            <i class="fa fa-play"></i> Send
                        </button>
                        <button class="btn btn-sm btn-default" type="button">
                            <i class="fa fa-trash"></i>
                        </button>
                    </span>
                </div>
            </div>
        </form>
    </div><!-- #com-console -->

</template><!-- #layout-com-pane -->
