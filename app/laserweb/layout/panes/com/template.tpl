<style>
#com-console-logs {
    overflow: auto;
    resize: vertical;
    min-height: 100px;
}
</style>

<template id="layout-com-pane">

    <form id="com-interface">
        <h4>Interface</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-plug"></i></span>
                <select id="com-interface-type" class="form-control">
                    <option value="serial" selected>Serial</option>
                    <option value="network">Network</option>
                </select><!-- #com-interface-type -->
            </div>
        </div>
    </form><!-- #com-interface -->

    <form id="com-serial-interface">
        <h4>Serial</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-usb"></i></span>
                <select id="com-serial-port" class="form-control">
                    <option value="select-port">Select port</option>
                </select><!-- #com-serial-port -->
                <span class="input-group-btn">
                    <button id="com-serial-refresh-port" class="btn btn-sm btn-secondary" type="button">
                        <i class="fa fa-refresh"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-tty"></i></span>
                <select id="com-serial-baud" class="form-control input-sm">
                    <option value="250000">250000</option>
                    <option value="230400">230400</option>
                    <option value="115200" selected>115200</option>
                    <option value="57600">57600</option>
                    <option value="38400">38400</option>
                    <option value="19200">19200</option>
                    <option value="9600">9600</option>
                </select><!-- #com-serial-baud -->
            </div>
        </div>
        <div class="form-group">
            <button id="com-serial-connect" class="btn btn-block btn-success disabled" type="button">
                Connect
            </button>
        </div>
    </form><!-- #com-serial-interface -->

    <form id="com-network-interface" class="hidden">
        <h4>Network</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-wifi"></i></span>
                <input id="com-network-ip" type="text" class="form-control" maxlength="16" placeholder="192.168.1.*" />
                <span class="input-group-btn">
                    <button id="com-network-connect" class="btn btn-sm btn-success" type="button">
                        Connect
                    </button>
                    <button id="com-network-scan" class="btn btn-sm btn-info" type="button">
                        Scan
                    </button>
                </span>
            </div>
        </div>
    </form><!-- #com-network-interface -->

    <hr />

    <div id="com-console">
        <h4>Console</h4>
        <div id="com-console-logs" class="panel panel-default"></div><!-- #com-console-logs -->
        <form>
            <div class="form-group">
                <div class="input-group input-group-sm">
                    <span class="input-group-addon"><i class="fa fa-terminal"></i></span>
                    <input id="com-console-command" type="text" class="form-control" />
                    <span class="input-group-btn">
                        <button id="com-console-command-send" class="btn btn-sm btn-default" type="button">
                            <i class="fa fa-play"></i> Send
                        </button>
                        <button id="com-console-command-clear" class="btn btn-sm btn-default" type="button">
                            <i class="fa fa-trash"></i>
                        </button>
                    </span>
                </div>
            </div>
        </form>
    </div><!-- #com-console -->

</template><!-- #layout-com-pane -->
