<style>
#com-console .logs {
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
                <select class="form-control">
                    <option value="serial" selected>Serial</option>
                    <option value="network">Network</option>
                </select>
            </div>
        </div>
    </form><!-- #com-interface -->

    <hr />

    <form id="com-serial">
        <h4>Serial</h4>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-usb"></i></span>
                <select class="form-control">
                    <option value="select-port">Select port</option>
                </select><!-- #com-serial-port -->
                <span class="input-group-btn">
                    <button class="btn btn-sm btn-secondary" type="button">
                        <i class="fa fa-refresh"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-tty"></i></span>
                <select class="form-control input-sm">
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
            <button class="btn btn-block btn-success disabled" type="button">
                Connect
            </button>
        </div>
    </form><!-- #com-serial -->

    <form id="com-network" class="hidden">
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

    <hr />

    <div id="com-console">
        <h4>Console</h4>
        <div class="logs panel panel-default"></div><!-- #com-console-logs -->
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
