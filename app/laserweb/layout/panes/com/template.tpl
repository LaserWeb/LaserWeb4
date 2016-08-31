<style>
#com-interface {

}
</style>

<template id="layout-com-pane">

    <form id="com-interface">
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-plug"></i></span>
                <select id="com-interface-type" class="form-control">
                    <option value="usb" selected>USB</option>
                    <option value="network">Network</option>
                </select><!-- #com-interface-type -->
            </div>
        </div>
    </form><!-- #com-interface -->

    <form id="com-usb-interface">
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-usb"></i></span>
                <select id="com-usb-port" class="form-control">
                    <option value="select-port">Select port</option>
                </select><!-- #com-usb-port -->
                <span class="input-group-btn">
                    <button id="com-usb-refresh-port" class="btn btn-sm btn-secondary" type="button">
                        <i class="fa fa-refresh"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group input-group-sm">
                <span class="input-group-addon"><i class="fa fa-tty"></i></span>
                <select id="com-usb-baud" class="form-control input-sm">
                    <option value="250000">250000</option>
                    <option value="230400">230400</option>
                    <option value="115200" selected>115200</option>
                    <option value="57600">57600</option>
                    <option value="38400">38400</option>
                    <option value="19200">19200</option>
                    <option value="9600">9600</option>
                </select><!-- #com-usb-baud -->
            </div>
        </div>
        <button id="com-usb-connect" class="btn btn-block btn-success disabled" type="button">
            Connect
        </button>
    </form><!-- #com-usb-interface -->

    <form id="com-network-interface" class="hidden">
        <label for="com-network-ip" class="control-label icon-white"><i class="fa fa-wifi"></i></label>
        <input id="com-network-ip" type="text" class="form-control" maxlength="16" placeholder="192.168.1.*" />
        <div class="btn-group">
            <a id="com-network-connect" class="btn btn-success" href="#">Connect</a>
            <a id="com-network-disconnect" class="btn btn-danger disabled" href="#"><i class="fa fa-times"></i></a>
        </div>
    </form><!-- #com-network-interface -->

</template><!-- #layout-com-pane -->
