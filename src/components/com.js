import React from 'react'
import { connect } from 'react-redux';

import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import { Input, TextField, NumberField, ToggleField, SelectField } from './forms';
import { setSettingsAttrs } from '../actions/settings';
import { setWorkspaceAttrs } from '../actions/workspace';

import CommandHistory from './command-history';

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

    constructor(props) {
        super(props);
        this.state = {ports: new Array()}
    }

    componentDidMount() {
        $('#disconnectS').addClass('disabled');
        $('#disconnect').addClass('disabled');
        if (!socket && !serverConnected) {
            this.handleConnectServer();
            socket.emit('firstload', 1);
        }
    }

    handleConnectServer() {
        let that = this;
        let {settings, dispatch} = this.props;
        let server = settings.commServerIP;
        CommandHistory.log('Connecting to Server ' + server, CommandHistory.WARNING);
        console.log('Connecting to Server ' + server);
        socket = io('ws://' + server);
        
        socket.on('disconnect', function() {
            CommandHistory.log('Disconnected from Server ' + settings.commServerIP, CommandHistory.WARNING);
            console.log('Disconnected from Server ' + settings.commServerIP);
            serverConnected = false;
            $('#connectS').removeClass('disabled');
            $('#disconnectS').addClass('disabled');
            machineConnected = false;
            $('#connect').removeClass('disabled');
            $('#disconnect').addClass('disabled');
        });

        socket.on('open', function(data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            // Web Socket is connected
            //console.log('open ' + data);
            CommandHistory.log('Socket opened: ' + data + '(' + socket.id + ')', CommandHistory.WARNING); //INFO
        });

        socket.on('config', function (data) {
            serverConnected = true;
            //CommandHistory.log('config: ' + data, CommandHistory.INFO);
            console.log('config: ' + data);
        });

        socket.on('activePort', function (data) {
            serverConnected = true;
            if (data.length > 0) {
                $('#connect').addClass('disabled');
                $('#disconnect').removeClass('disabled');
            }
            //CommandHistory.log('activePorts: ' + data);
            console.log('activePorts: ' + data);
        });

        socket.on('ports', function (data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                let ports = new Array();
                for (var i = 0; i < data.length; i++) {
                    ports.push(data[i].comName);
                }
                that.setState({ports: ports});
                console.log('ports: ' + ports);
                //CommandHistory.log('ports: ' + ports);
            } else {
                CommandHistory.log('No serial ports found on server!', CommandHistory.DANGER);
            }
        });

        socket.on('connectStatus', function (data) {
            console.log('connectStatus: ' + data);
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.indexOf('opened') >= 0) {
                machineConnected = true;
                $('#connect').addClass('disabled');
                $('#disconnect').removeClass('disabled');
                CommandHistory.log('Machine connectd');
            }
            if (data.indexOf('Connect') >= 0) {
                machineConnected = false;
                $('#connect').removeClass('disabled');
                $('#disconnect').addClass('disabled');
                CommandHistory.log('Machine disconnected');
            }
        });

        socket.on('error', function (data) {
            CommandHistory.log('error: ' + data);
            console.log('error: ' + data);
        });

        socket.on('runStatus', function (status) {
            //CommandHistory.log('runStatus: ' + status);
            console.log('runStatus: ' + status);
            if (status === 'Alarm') {
//                socket.emit('clearAlarm', 2);
            }
        });

        socket.on('data', function (data) {
            serverConnected = true;
            if (data.indexOf('<') === 0) {
                //CommandHistory.log('statusReport: ' + data);
                machineConnected = true;
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
                    dispatch(setWorkspaceAttrs({ workPos: [xpos, ypos, zpos] }));
                }
                updateStatus(data);
            } else if (data.indexOf('{\"sr\"') === 0) {
                machineConnected = true;
                //updateStatusTinyG(data);
            } else if (data === 'ok') {
                machineConnected = true;
                //CommandHistory.log(data, '#cccccc', "usb");
            } else {
                //CommandHistory.log(data, msgcolor, "usb");
            }
            if (data.indexOf('LPC176')) { //LPC1768 or LPC1769 should be Smoothie
                machineConnected = true;
                //console.log('Smoothieware detected');
            }
            if (data.indexOf('Grbl') === 0) {
                machineConnected = true;
                if (parseFloat(data.substr(5)) >= 1.1) { //is Grbl >= v1.1
                    //console.log('GRBL >= 1.1 detected');
                } else {
                    CommandHistory.log('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e');
                    socket.emit('closePort', 1);
                    machineConnected = false;
                    //console.log('GRBL < 1.1 not supported!');
                }
            }
        });

        socket.on('wpos', function (wpos) {
            serverConnected = true;
            machineConnected = true;
            var pos = wpos.split(',');
            var xpos = parseFloat(pos[0]).toFixed(2);
            var ypos = parseFloat(pos[1]).toFixed(2);
            var zpos = parseFloat(pos[2]).toFixed(2);
            //CommandHistory.log('WPos: ' + xpos + ' / ' + ypos + ' / ' + zpos);
            console.log('WPos: ' + xpos + ' / ' + ypos + ' / ' + zpos);
            $('#mX').html(xpos);
            $('#mY').html(ypos);
            $('#mZ').html(zpos);
            dispatch(setWorkspaceAttrs({ workPos: [xpos, ypos, zpos] }));
        });

        // smoothie feed override report (from server)
        socket.on('feedOverride', function (data) {
            serverConnected = true;
            //CommandHistory.log('feedOverride: ' + data);
            //console.log('feedOverride ' + data);
            //$('#oF').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // smoothie spindle override report (from server)
        socket.on('spindleOverride', function (data) {
            serverConnected = true;
            //CommandHistory.log('spindleOverride: ' + data);
            //console.log('spindleOverride ' + data);
            //$('#oS').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // laserTest state
        socket.on('laserTest', function (data) {
            serverConnected = true;
            CommandHistory.log('laserTest: ' + data);
            console.log('laserTest ' + data);
            if (data >= 1){
                laserTestOn = true;
                $("#lT").addClass('btn-highlight');
            } else if (data === 0) {
                laserTestOn = false;
                $('#lT').removeClass('btn-highlight');
            }
        });

        socket.on('runningJob', function (data) {
            serverConnected = true;
            CommandHistory.log('runningJob: ' + data);
            //console.log('runningJob ' + data);
        });

        socket.on('qCount', function (data) {
            serverConnected = true;
            $('#connect').addClass('disabled');
            $('#disconnect').removeClass('disabled');
            console.log('qCount ' + data);
            data = parseInt(data);
            $('#queueCnt').html('Queued: ' + data);
            if (data === 0) {
                queueEmptyCount++;
                if (queueEmptyCount == 4) {
                    playing = false;
                    paused = false;
                    $('#playicon').removeClass('fa-pause');
                    $('#playicon').addClass('fa-play');

                    if (jobStartTime >= 0) {
                        var jobFinishTime = new Date(Date.now());
                        var elapsedTimeMS = jobFinishTime.getTime() - jobStartTime.getTime();
                        var elapsedTime = Math.round(elapsedTimeMS / 1000);
                        CommandHistory.log("Job started at " + jobStartTime.toString(), msgcolor, "file");
                        CommandHistory.log("Job finished at " + jobFinishTime.toString(), msgcolor, "file");
                        CommandHistory.log("Elapsed time: " + elapsedTime + " seconds.", msgcolor, "file");
                        jobStartTime = -1;

                        // Update accumulated job time
                        var accumulatedJobTimeMS = accumulateTime(elapsedTimeMS);

                        CommandHistory.log("Total accumulated job time: " + (accumulatedJobTimeMS / 1000).toHHMMSS());
                    }
                }
            }
        });

        socket.on('close', function() { 
            serverConnected = false;
            $('#connectS').removeClass('disabled');
            $('#disconnectS').addClass('disabled');
            machineConnected = false;
            $('#connect').removeClass('disabled');
            $('#disconnect').addClass('disabled');
            CommandHistory.log('Server connection closed', CommandHistory.DANGER);
            // websocket is closed.
            //console.log('Server connection closed'); 
        });
    }
    
    handleDisconnectServer() {
        if (socket) {
            CommandHistory.log('Disconnecting from server');
            socket.disconnect();
        }
    }
    
    handleConnectMachine() {
        var connectVia = this.props.settings.connectVia;
        var connectPort = this.props.settings.connectPort.trim();
        var connectBaud = this.props.settings.connectBaud;
        var connectIP = this.props.settings.connectIP;
        switch (connectVia) {
            case 'USB':
                CommandHistory.log('connectTo: ' + connectVia + ',' + connectPort + ',' + connectBaud + 'baud');
                socket.emit('connectTo', connectVia + ',' + connectPort + ',' + connectBaud);
                break;
            case 'Telnet':
                CommandHistory.log('connectTo: ' + connectVia + ',' + connectIP);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                CommandHistory.log('connectTo: ' + connectVia + ',' + connectIP);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    }

    handleDisconnectMachine() {
        CommandHistory.log('disconnecting Machine');
        socket.emit('closePort');
    }

    
    render() {
        let {settings, dispatch} = this.props;
        
        return (
            <div style={{paddingTop: 2}}>
                <PanelGroup>
                    <Panel collapsible header="Server Connection" bsStyle="primary" eventKey="1" defaultExpanded={false}>
                        <TextField {...{ object: settings, field: 'commServerIP', setAttrs: setSettingsAttrs, description: 'Server IP' }} />
                        <ButtonGroup>
                            <Button id="connectS" bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectServer(e)}}><Icon name="share" /> Connect</Button>
                            <Button id="disconnectS" bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectServer(e)}}><Glyphicon glyph="trash" /> Disconnect</Button>
                        </ButtonGroup>
                    </Panel>

                    <Panel collapsible header="Machine Connection" bsStyle="primary" eventKey="2" defaultExpanded={true}>
                        <SelectField {...{ object: settings, field: 'connectVia', setAttrs: setSettingsAttrs, data: ['USB', 'Telnet', 'ESP8266'], defaultValue: 'USB', description: 'Machine Connection', selectProps: { clearable: false } }} />
                        <Collapse in={settings.connectVia == 'USB'}>
                            <div>
                                <SelectField {...{ object: settings, field: 'connectPort', setAttrs: setSettingsAttrs, data: this.state.ports, defaultValue: '', description: 'USB / Serial Port', selectProps: { clearable: false } }} />
                                <SelectField {...{ object: settings, field: 'connectBaud', setAttrs: setSettingsAttrs, data: ['250000', '230400', '115200', '57600', '38400', '19200', '9600'], defaultValue: '115200', description: 'Baudrate', selectProps: { clearable: false } }} />
                            </div>
                        </Collapse>
                        <Collapse in={settings.connectVia != 'USB'}>
                            <div>
                                <TextField {...{ object: settings, field: 'connectIP', setAttrs: setSettingsAttrs, description: 'Machine IP' }} />
                            </div>
                        </Collapse>
                        <ButtonGroup>
                            <Button id="connect" bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectMachine(e)}}><Icon name="share" /> Connect</Button>
                            <Button id="disconnect" bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectMachine(e)}}><Glyphicon glyph="trash" /> Disconnect</Button>
                        </ButtonGroup>
                    </Panel>

                    <Panel collapsible header="Console" bsStyle="primary" eventKey="3" defaultExpanded={true}>
                        <CommandHistory onCommandExec={(e) => {runCommand(e)}}/>
                    </Panel>
                </PanelGroup>
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
                
                <button onClick={e => dispatch(setWorkspaceAttrs({ workPos: [50, 50, 0] }))}>Set Work Pos B</button>
                <button onClick={e => { CommandHistory.log("weeheh",CommandHistory.DANGER) } }>Console LOG</button>

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

    // Extract override values (for Grbl > v1.1 only!)
    var startOv = data.search(/ov:/i) + 3;
    if (startOv > 3) {
        var ov = data.replace('>', '').substr(startOv).split(/,|\|/, 3);
        //CommandHistory.log("Overrides: " + ov[0] + ',' + ov[1] + ',' + ov[2],  msgcolor, "USB");
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
    if (serverConnected) {
        if (machineConnected){
            if (gcode) {
                //console.log('runCommand', gcode);
                socket.emit('runCommand', gcode);
            }
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function runJob(job) {
    console.log('runJob(' + job.lenght + ')');
    if (serverConnected) {
        if (machineConnected){
            if (job) {
                CommandHistory.log('runJob(' + job.lenght + ')', CommandHistory.DANGER);
                socket.emit('runJob', job);
            } else {
                CommandHistory.log('Job empty!', CommandHistory.DANGER);
            }
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function pauseJob(gcode) {
    //console.log('pauseJob', gcode);
    if (serverConnected) {
        if (machineConnected){
            if (gcode) {
                socket.emit('pause', gcode);
            } else {
                socket.emit('pause', 0);
            }
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function resumeJob(gcode = null) {
    //console.log('resumeJpb', gcode);
    if (serverConnected) {
        if (machineConnected){
            if (gcode) {
                socket.emit('resume', gcode);
            } else {
                socket.emit('resume', 0);
            }
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function abortJob() {
    console.log('abortJob');
    if (serverConnected) {
        if (machineConnected){
            CommandHistory.log('Abort job', CommandHistory.DANGER);
            socket.emit('stop');
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function setZero(axis) {
    if (serverConnected) {
        if (machineConnected){
            CommandHistory.log('Zero ' + axis + ' axis', CommandHistory.DANGER);
            socket.emit('zeroAxis', axis);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function laserTest(power, duration, maxS) {
    if (serverConnected) {
        if (machineConnected){
            console.log('laserTest(' + power + ', ' + duration + ', ' + maxS + ')');
            socket.emit('laserTest', power + ',' + duration + ',' + maxS);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function jog(axis, dist, feed) {
    if (serverConnected) {
        if (machineConnected){
            //console.log('jog(' + axis + ',' + dist + ',' + feed + ')');
            socket.emit('jog', axis + ',' + dist + ',' + feed);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function feedOverride(step) {
    if (serverConnected) {
        if (machineConnected){
            console.log('feedOverride ' + step);
            socket.emit('feedOverride', step);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function spindleOverride(step) {
    if (serverConnected) {
        if (machineConnected){
            console.log('spindleOverride ' + step);
            socket.emit('spindleOverride', step);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function playpauseMachine() {
    if (serverConnected) {
        if (machineConnected){
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
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

Com = connect(
    state => ({ settings: state.settings, ports: state.ports, documents: state.documents, gcode: state.gcode })
)(Com);

export default Com
