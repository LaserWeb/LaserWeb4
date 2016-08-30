<template id="layout-com-pane">
    <form id="com-interface" class="form-inline">
        <label for="com-interface-type" class="control-label  icon-white"><i class="fa fa-2x fa-plug"></i></label>
        <select id="com-interface-type" class="form-control">
            <option value="usb" selected>USB</option>
            <option value="network">Network</option>
        </select>
    </form><!-- #com-interface -->
    <form id="com-usb-interface" class="form-inline">
        <label for="com-usb-port" class="control-label  icon-white"><i class="fa fa-2x fa-usb"></i></label>
        <select id="com-usb-port" class="form-control">
            <option value="select-port">Select port</option>
        </select><!-- #com-usb-interface -->
        <label for="com-usb-baud" class="control-label  icon-white"><i class="fa fa-2x fa-tty"></i></label>
        <select id="com-usb-baud" class="form-control">
            <option value="250000">250000</option>
            <option value="230400">230400</option>
            <option value="115200" selected>115200</option>
            <option value="57600">57600</option>
            <option value="38400">38400</option>
            <option value="19200">19200</option>
            <option value="9600">9600</option>
        </select><!-- #com-usb-baud -->
        <a id="com-usb-connect" class="btn btn-success disabled" href="#">Connect</a>
        <a id="com-usb-disconnect" class="btn btn-danger disabled" href="#"><i class="fa fa-times"></i></a>
        <a id="com-usb-refresh-port" class="btn btn-default" href="#"><i class="fa fa-refresh"></i></a>
    </form><!-- #com-usb-interface -->
</template><!-- #layout-com-pane -->

<template id="layout-com-modal">
    <p>test...</p>
</template><!-- #layout-com-modal -->
