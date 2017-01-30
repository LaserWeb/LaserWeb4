import React from 'react'
import { connect } from 'react-redux';

import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import { Input, TextField, NumberField, ToggleField, SelectField } from './forms';
import { setSettingsAttrs } from '../actions/settings';

import Icon from './font-awesome';

import io from 'socket.io-client';
var socket, connectVia;
var serverConnected = false;
var machineConnected = false;
var jobStartTime = -1;
var playing = false;
var paused = false;
var queueEmptyCount = 0;
var laserTestOn = false;
var firmware;

class Com extends React.Component {

    handleConnectServer() {
        let { settings, documents } = this.props;
        let server = settings.commServerIP;
        console.log('Connecting to Server ' + server);
        socket = io('ws://' + server);
        
        socket.on('disconnect', function() {
            console.log('Disconnected from Server ' + settings.commServerIP);
            serverConnected = false;
        });
        
        socket.emit('firstload');

        socket.on('open', function(data) {
            // Web Socket is connected
            //console.log('open ' + data);
            serverConnected = true;
        });

        socket.on('config', function (data) {
            console.log('config: ' + data);
        });

        socket.on('activePorts', function (data) {
            console.log('activePorts: ' + data);
        });

        socket.on('ports', function (data) {
            console.log('ports: ' + data);
//            var options = $("#react-select-12--value");
//            for (var i = 0; i < data.length; i++) {
//                options.append($("<option />").val(data[i].comName).text(data[i].comName));
//            }
//            $('#connect').removeClass('disabled');
//            // Might as well pre-select the last-used port and buffer
//            var lastConn = loadSetting("lastUsedConn");
//            var lastUsed = loadSetting("lastUsedPort");
//            var lastBaud = loadSetting("lastUsedBaud");
//            $("#connectVia option:contains(" + lastConn + ")").attr('selected', 'selected');
//            $("#port option:contains(" + lastUsed + ")").attr('selected', 'selected');
//            $("#baud option:contains(" + lastBaud + ")").attr('selected', 'selected');
        });

        socket.on('connectStatus', function (data) {
            console.log('connectStatus: ' + data);
            if (data.indexOf('opened') >= 0) {
                machineConnected = true;
            }
            if (data.indexOf('Connect') >= 0) {
                machineConnected = false;
            }
        });

        socket.on('error', function (data) {
            console.log('Error: ' + data);
        });

        socket.on('data', function (data) {
            if (data.indexOf('<') === 0) {
                //console.log(data);
                updateStatus(data);
            } else if (data.indexOf('{\"sr\"') === 0) {
                //updateStatusTinyG(data);
            } else if (data === 'ok') {
                //printLog(data, '#cccccc', "usb");
            } else {
                //printLog(data, msgcolor, "usb");
            }
            if (data.indexOf('LPC176')) { //LPC1768 or LPC1769 should be Smoothie
                //console.log('Smoothieware detected');
            }
            if (data.indexOf('Grbl') === 0) {
                if (parseFloat(data.substr(5)) >= 1.1) { //is Grbl >= v1.1
                    //console.log('GRBL >= 1.1 detected');
                } else {
                    socket.emit('closePort', 1);
                    machineConnected = false;
                    //console.log('GRBL < 1.1 not supported!');
                }
            }
        });

        socket.on('wpos', function (wpos) {
            var pos = wpos.split(',');
            var xpos = parseFloat(pos[0]).toFixed(2);
            var ypos = parseFloat(pos[1]).toFixed(2);
            var zpos = parseFloat(pos[2]).toFixed(2);
            console.log('WPos: ' + xpos + ' / ' + ypos + ' / ' + zpos);
            $('#mX').html(xpos);
            $('#mY').html(ypos);
            $('#mZ').html(zpos);
            if (bullseye) {
                setBullseyePosition(pos[0], pos[1], pos[2]); // Also updates #mX #mY #mZ
            }
        });

        // smoothie feed override report (from server)
        socket.on('feedOverride', function (data) {
            //console.log('feedOverride ' + data);
            //$('#oF').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // smoothie spindle override report (from server)
        socket.on('spindleOverride', function (data) {
            //console.log('spindleOverride ' + data);
            //$('#oS').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // laserTest state
        socket.on('laserTest', function (data) {
            //console.log('laserTest ' + data);
            //if (data >= 1){
            //    laserTestOn = true;
            //    $("#lT").addClass('btn-highlight');
            //} else if (data === 0) {
            //    laserTestOn = false;
            //    $('#lT').removeClass('btn-highlight');
            //}
        });

        socket.on('runningJob', function (data) {
            //console.log('runningJob ' + data);
        });

        socket.on('qCount', function (data) {
            //console.log('qCount ' + data);
        });

        socket.on('close', function() { 
            // websocket is closed.
            //console.log('Server connection closed'); 
        });
    }
    
    handleDisconnectServer() {
        if (socket) {
            socket.disconnect();
        }
    }
    
    handleConnectMachine() {
        var connectVia = this.props.settings.connectVia;
        var connectPort = this.props.settings.connectPort;
        var connectBaud = this.props.settings.connectBaud;
        var connectIP = this.props.settings.connectIP;
        switch (connectVia) {
            case 'USB':
                socket.emit('connectTo', connectVia + ',' + connectPort + ',' + connectBaud);
                break;
            case 'Telnet':
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    }

    handleDisconnectMachine() {
        socket.emit('closePort');
    }

//    sendCommand(gcode) {
//        if (gcode) {
//            console.log('runCommand ', gcode)
//            socket.emit('runCommand', gcode);
//        }
//    }
//
//    runJob(gcode) {
//        if (gcode) {
//            console.log('runJob ', gcode)
//            socket.emit('runJob', gcode);
//        }
//    }

    render() {
        let {settings, dispatch} = this.props;
        
        return (
            <div>
                <h4>LaserWeb Comm-Server</h4>
                <TextField {...{ object: settings, field: 'commServerIP', setAttrs: setSettingsAttrs, description: 'Server IP' }} />
                <ButtonGroup>
                    <Button bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectServer(e)}}><Icon name="share" /> Connect</Button>
                    <Button bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectServer(e)}}><Glyphicon glyph="trash" /> Disconnect</Button>
                </ButtonGroup>
                <br />
                <br />
                <SelectField {...{ object: settings, field: 'connectVia', setAttrs: setSettingsAttrs, data: ['USB', 'Telnet', 'ESP8266'], defaultValue: 'USB', description: 'Machine Connection', selectProps: { clearable: false } }} />
                <Collapse in={settings.connectVia == 'USB'}>
                    <div>
                        <SelectField {...{ object: settings, field: 'connectPort', setAttrs: setSettingsAttrs, data: ['COM4'], defaultValue: '', description: 'USB / Serial Port', selectProps: { clearable: false } }} />
                        <SelectField {...{ object: settings, field: 'connectBaud', setAttrs: setSettingsAttrs, data: ['250000', '230400', '115200', '57600', '38400', '19200', '9600'], defaultValue: '115200', description: 'Baudrate', selectProps: { clearable: false } }} />
                    </div>
                </Collapse>
                <Collapse in={settings.connectVia != 'USB'}>
                    <div>
                        <TextField {...{ object: settings, field: 'connectIP', setAttrs: setSettingsAttrs, description: 'Machine IP' }} />
                    </div>
                </Collapse>
                <ButtonGroup>
                    <Button bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectMachine(e)}}><Icon name="share" /> Connect</Button>
                    <Button bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectMachine(e)}}><Glyphicon glyph="trash" /> Disconnect</Button>
                </ButtonGroup>
                <br />
                <br />
            </div>    
        )
        /*      <h4>Fancy controls examples</h4>
                <NumberField {...{ object: settings, field: 'serverIP', setAttrs: setSettingsAttrs, description: 'Server IP', units: 'IPv4' }} />
                <ToggleField {...{ object: settings, field: 'commServerConnect', setAttrs: setSettingsAttrs, description: 'Connect server' }} />

                <h4>Basic controls examples</h4>
                <button onClick={e => this.useGcode()}>Use gcode</button>

                <input type="checkbox"
                    checked={settings.commServerConnect}
                    onChange={e => dispatch(setSettingsAttrs({ commServerConnect: e.target.checked }))}
                    />
                <br />
        */
    }
}



function updateStatus(data) {
    // Smoothieware: <Idle,MPos:49.5756,279.7644,-15.0000,WPos:0.0000,0.0000,0.0000>
    // till GRBL v0.9: <Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>
    // since GRBL v1.1: <Idle|WPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|Pn:S|WCO:0.000,0.000,0.000> (when $10=2)

    // Extract state
    var state = data.substring(data.indexOf('<') + 1, data.search(/(,|\|)/));
    if (state === 'Alarm') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").addClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").removeClass('badge-busy');
        if ($('#alarmmodal').is(':visible')) {
            // Nothing, its already open
        } else {
            $('#alarmmodal').modal('show');
        }
    } else if (state === 'Home') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").addClass('badge-busy');
        if ($('#alarmmodal').is(':visible')) {
            $('#alarmmodal').modal('hide');
        }
    } else if (state === 'Hold') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").addClass('badge-warn');
        $("#machineStatus").removeClass('badge-busy');
        if ($('#alarmmodal').is(':visible')) {
            $('#alarmmodal').modal('hide');
        }
    } else if (state === 'Idle') {
        $("#machineStatus").addClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").removeClass('badge-busy');
        if ($('#alarmmodal').is(':visible')) {
            $('#alarmmodal').modal('hide');
        }
    } else if (state === 'Run') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").addClass('badge-busy');
        if ($('#alarmmodal').is(':visible')) {
            $('#alarmmodal').modal('hide');
        }
    }
    $('#machineStatus').html(state);

    // Extract Pos
    var startPos = data.search(/wpos:/i) + 5;
    var pos;
    if (startPos > 5) {
        pos = data.replace('>', '').substr(startPos).split(/,|\|/, 3);
    } else {
        startPos = data.search(/mpos:/i) + 5;
        if (startPos > 5) {
            pos = data.replace('>', '').substr(startPos).split(/,|\|/, 3);
        }
    }
    if (Array.isArray(pos)) {
        var xpos = parseFloat(pos[0]).toFixed(2);
        var ypos = parseFloat(pos[1]).toFixed(2);
        var zpos = parseFloat(pos[2]).toFixed(2);

        $('#mX').html(xpos);
        $('#mY').html(ypos);
        $('#mZ').html(zpos);
//        if (bullseye) {
//            setBullseyePosition(pos[0], pos[1], pos[2]); // Also updates #mX #mY #mZ
//        }
    }

    // Extract override values (for Grbl > v1.1 only!)
    var startOv = data.search(/ov:/i) + 3;
    if (startOv > 3) {
        var ov = data.replace('>', '').substr(startOv).split(/,|\|/, 3);
        //printLog("Overrides: " + ov[0] + ',' + ov[1] + ',' + ov[2],  msgcolor, "USB");
        if (Array.isArray(ov)) {
            $('#oF').html(ov[0].trim() + '<span class="drounitlabel"> %</span>');
            //$('#oR').html(ov[1].trim() + '<span class="drounitlabel"> %</span>');
            $('#oS').html(ov[2].trim() + '<span class="drounitlabel"> %</span>');
        }
    }

    // Extract realtime Feedrate (for Grbl > v1.1 only!)
    var startFS = data.search(/FS:/i) + 3;
    if (startFS > 3) {
        var fs = data.replace('>', '').substr(startFS).split(/,|\|/, 2);
        if (Array.isArray(fs)) {
            //$('#mF').html(fs[0].trim());
            //$('#mS').html(fs[1].trim());
            if (laserTestOn === true) {
                if (fs[1].trim() === 0) {
                    laserTestOn = false;
                    $('#lT').removeClass('btn-highlight');
                }
            }
        }
    }
}

export function runCommand(gcode) {
    if (gcode) {
        console.log('runCommand', gcode)
        socket.emit('runCommand', gcode);
    }
}

export function runJob(gcode) {
    if (gcode) {
        console.log('runJob', gcode)
        socket.emit('runJob', gcode);
    }
}

export function pauseJob(gcode) {
    console.log('pauseJob', gcode)
    if (gcode) {
        socket.emit('pause', gcode);
    } else {
        socket.emit('pause', 0);
    }
}

export function resumeJob(gcode = null) {
    console.log('resumeJpb', gcode)
    if (gcode) {
        socket.emit('resume', gcode);
    } else {
        socket.emit('resume', 0);
    }
}

export function abortJob() {
    console.log('abortJob')
    socket.emit('stop');
}

export function feedOverride(step) {
    console.log('feedOverride ' + step)
    socket.emit('feedOverride', step);
}

export function spindleOverride(step) {
    console.log('spindleOverride ' + step)
    socket.emit('spindleOverride', step);
}

export function playpauseMachine() {
    if (machineConnected) {
        if (playing === true) {
            if (paused === true) {
                // unpause
                var laseroncmd = document.getElementById('laseron').value;
                if (laseroncmd.length === 0) {
                    laseroncmd = 0;
                }
                socket.emit('resume', laseroncmd);
                paused = false;
                $('#playicon').removeClass('fa-play');
                $('#playicon').addClass('fa-pause');
                // end ifPaused
            } else {
                // pause
                var laseroffcmd = document.getElementById('laseroff').value;
                if (laseroffcmd.length === 0) {
                    laseroffcmd = 0;
                }
                socket.emit('pause', laseroffcmd);
                paused = true;
                $('#playicon').removeClass('fa-pause');
                $('#playicon').addClass('fa-play');
            }
            // end isPlaying
        } else {
            playGcode();
        }
        // end isConnected
    } else {
        printLog('You have to Connect to a machine First!', errorcolor, "usb");
    }
}

Com = connect(
    state => ({ settings: state.settings, documents: state.documents, gcode: state.gcode })
)(Com);

export default Com
