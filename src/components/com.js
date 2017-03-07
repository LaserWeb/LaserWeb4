import React from 'react'
import { connect } from 'react-redux';

import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import { Input, TextField, NumberField, ToggleField, SelectField } from './forms';
import { runStatus } from './jog.js';
import { setSettingsAttrs } from '../actions/settings';
import { setWorkspaceAttrs } from '../actions/workspace';
import { setGcode } from '../actions/gcode';
import CommandHistory from './command-history';

import { alert, prompt, confirm} from './laserweb';

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
var firmware, fVersion, fDate;
var xpos, ypos, zpos;

class Com extends React.Component {

    constructor(props) {
        super(props);
        let {comInterfaces, comPorts} = this.props.settings;
        this.state = {comInterfaces: comInterfaces, comPorts: comPorts};
    }

    componentDidMount() {
        if (!serverConnected) {
            $('#connectS').removeClass('disabled');
            $('#disconnectS').addClass('disabled');
            if (!socket && !serverConnected) {
                this.handleConnectServer();
            }
        } else {
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (!machineConnected) {
                $('#connect').removeClass('disabled');
                $('#disconnect').addClass('disabled');
            } else {
                $('#connect').addClass('disabled');
                $('#disconnect').removeClass('disabled');
            }
        }
    }

    handleConnectServer() {
        let that = this;
        let {settings, dispatch} = this.props;
        let server = settings.comServerIP;
        CommandHistory.log('Connecting to Server @ ' + server, CommandHistory.INFO);
        //console.log('Connecting to Server ' + server);
        socket = io('ws://' + server);

        socket.on('connect', function(data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            socket.emit('firstload');
            socket.emit('getServerConfig');
            CommandHistory.log('Server connected', CommandHistory.SUCCESS);
        });
        
        socket.on('disconnect', function() {
            CommandHistory.log('Disconnected from Server ' + settings.comServerIP, CommandHistory.DANGER);
            //console.log('Disconnected from Server ' + settings.commServerIP);
            serverConnected = false;
            $('#connectS').removeClass('disabled');
            $('#disconnectS').addClass('disabled');
            machineConnected = false;
            $('#connect').removeClass('disabled');
            $('#disconnect').addClass('disabled');
        });

//        socket.on('open', function(data) {
//            serverConnected = true;
//            $('#connectS').addClass('disabled');
//            $('#disconnectS').removeClass('disabled');
//            // Web Socket is connected
//            //console.log('open ' + data);
//            socket.emit('getInterfaces');
//            socket.emit('getPorts');
//            CommandHistory.log('Socket opened: ' + data + '(' + socket.id + ')', CommandHistory.INFO);
//        });

        socket.on('serverConfig', function (data) {
            serverConnected = true;
            let serverVersion = data.serverVersion;
            dispatch(setSettingsAttrs({comServerVersion: serverVersion}));
            //CommandHistory.log('Server version: ' + serverVersion, CommandHistory.INFO);
            console.log('serverVersion: ' + serverVersion);
        });
        
        socket.on('interfaces', function(data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                let interfaces = new Array();
                for (var i = 0; i < data.length; i++) {
                    interfaces.push(data[i]);
                }
                that.setState({comInterfaces: interfaces});
                dispatch(setSettingsAttrs({comInterfaces: interfaces}));
                console.log('interfaces: ' + interfaces);
                //CommandHistory.log('interfaces: ' + interfaces);
            } else {
                CommandHistory.log('No supported interfaces found on server!', CommandHistory.DANGER);
            }
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
                that.setState({comPorts: ports});
                dispatch(setSettingsAttrs({comPorts: ports}));
                console.log('ports: ' + ports);
                //CommandHistory.log('ports: ' + ports);
            } else {
                CommandHistory.log('No serial ports found on server!', CommandHistory.DANGER);
            }
        });

        socket.on('activeInterface', function (data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                //set the actual interface
            }
            console.log('activeInterface: ' + data);
        });

        socket.on('activePort', function (data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                //set the actual port
            }
            console.log('activePorts: ' + data);
        });

        socket.on('activeBaudRate', function (data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                //set the actual baudrate
            }
            console.log('activeBaudrate: ' + data);
        });

        socket.on('activeIP', function (data) {
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            if (data.length > 0) {
                //set the actual machine IP
            }
            console.log('activeIP: ' + data);
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
                CommandHistory.log('Machine connected', CommandHistory.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                machineConnected = false;
                $('#connect').removeClass('disabled');
                $('#disconnect').addClass('disabled');
                CommandHistory.log('Machine disconnected', CommandHistory.DANGER);
            }
        });

        socket.on('firmware', function (data) {
            console.log('firmware: ' + data);
            serverConnected = true;
            $('#connectS').addClass('disabled');
            $('#disconnectS').removeClass('disabled');
            machineConnected = true;
            $('#connect').addClass('disabled');
            $('#disconnect').removeClass('disabled');
            firmware = data.firmware;
            fVersion = data.version;
            fDate = data.date;
            CommandHistory.log('Firmware ' + firmware + ' ' + fVersion + ' detected', CommandHistory.SUCCESS);
            if (fVersion < '1.1e') {
                CommandHistory.log('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e', CommandHistory.DANGER);
                socket.emit('closePort', 1);
                machineConnected = false;
                //console.log('GRBL < 1.1 not supported!');
            }
        });

        socket.on('runningJob', function (data) {
            CommandHistory.log('runningJob(' + data.length + ')', CommandHistory.WARN);
            alert(data);
            //setGcode(data);
        });
        
        socket.on('runStatus', function (status) {
            //CommandHistory.log('runStatus: ' + status);
            console.log('runStatus: ' + status);
            if (status === 'running') {
                playing = true;
                paused = false;
            } else if (status === 'paused') {
                paused = true;
            } else if (status === 'resumed') {
                paused = false;
            } else if (status === 'stopped') {
                playing = false;
                paused = false;
            } else if (status === 'finished') {
                playing = false;
                paused = false;
            } else if (status === 'alarm') {
                CommandHistory.log('ALARM!', CommandHistory.DANGER);
                //socket.emit('clearAlarm', 2);
            }
            runStatus(status);
        });

        socket.on('data', function (data) {
            serverConnected = true;
            machineConnected = true;
            if (data) {
                if (data.indexOf('<') === 0) {
                    //CommandHistory.log('statusReport: ' + data);
                    updateStatus(data);
                } else {
                    var style = CommandHistory.STD;
                    if (data.indexOf('[MSG:') === 0) {
                        style = CommandHistory.WARN;
                    } else if (data.indexOf('ALARM:') === 0) {
                        style = CommandHistory.DANGER;
                    } else if (data.indexOf('error:') === 0) {
                        style = CommandHistory.DANGER;
                    }                    
                    CommandHistory.log(data, style);
                }
            }
        });

        socket.on('wPos', function (wpos) {
            serverConnected = true;
            machineConnected = true;
            let {x, y, z} = wpos; //var pos = wpos.split(',');
            let posChanged = false;
            if (xpos !== x) {
                xpos = x;
                posChanged = true;
            }
            if (ypos !== y) {
                ypos = y;
                posChanged = true;
            }
            if (zpos !== z) {
                zpos = z;
                posChanged = true;
            }
            if (posChanged) {
                //CommandHistory.log('WPos: ' + xpos + ' / ' + ypos + ' / ' + zpos);
                //console.log('WPos: ' + xpos + ' / ' + ypos + ' / ' + zpos);
                $('#mX').html(xpos);
                $('#mY').html(ypos);
                $('#mZ').html(zpos);
                dispatch(setWorkspaceAttrs({ workPos: [xpos, ypos, zpos] }));
            }
        });

        // feed override report (from server)
        socket.on('feedOverride', function (data) {
            serverConnected = true;
            //CommandHistory.log('feedOverride: ' + data, CommandHistory.STD);
            //console.log('feedOverride ' + data);
            $('#oF').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // spindle override report (from server)
        socket.on('spindleOverride', function (data) {
            serverConnected = true;
            //CommandHistory.log('spindleOverride: ' + data, CommandHistory.STD);
            //console.log('spindleOverride ' + data);
            $('#oS').html(data.toString() + '<span class="drounitlabel"> %</span>');
        });

        // real feed report (from server)
        socket.on('realFeed', function (data) {
            serverConnected = true;
            //CommandHistory.log('realFeed: ' + data, CommandHistory.STD);
            //console.log('realFeed ' + data);
            //$('#mF').html(data);
        });

        // real spindle report (from server)
        socket.on('realSpindle', function (data) {
            serverConnected = true;
            //CommandHistory.log('realSpindle: ' + data, CommandHistory.STD);
            //console.log('realSpindle ' + data);
            //$('#mS').html(data);
        });

        // laserTest state
        socket.on('laserTest', function (data) {
            serverConnected = true;
            //CommandHistory.log('laserTest: ' + data, CommandHistory.STD);
            //console.log('laserTest ' + data);
            if (data > 0){
                laserTestOn = true;
                $("#lT").addClass('btn-highlight');
            } else if (data === 0) {
                laserTestOn = false;
                $('#lT').removeClass('btn-highlight');
            }
        });

        socket.on('qCount', function (data) {
            serverConnected = true;
            $('#connect').addClass('disabled');
            $('#disconnect').removeClass('disabled');
            //console.log('qCount ' + data);
            data = parseInt(data);
            $('#queueCnt').html('Queued: ' + data);
            if (playing && data === 0) {
                playing = false;
                paused = false;
                runStatus('stopped');
                $('#playicon').removeClass('fa-pause');
                $('#playicon').addClass('fa-play');

                if (jobStartTime >= 0) {
                    var jobFinishTime = new Date(Date.now());
                    var elapsedTimeMS = jobFinishTime.getTime() - jobStartTime.getTime();
                    var elapsedTime = Math.round(elapsedTimeMS / 1000);
                    CommandHistory.log("Job started at " + jobStartTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.log("Job finished at " + jobFinishTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.log("Elapsed time: " + secToHMS(elapsedTime), CommandHistory.SUCCESS);
                    jobStartTime = -1;
                    let accumulatedJobTime = settings.jogAccumulatedJobTime + elapsedTime;
                    dispatch(setSettingsAttrs({jogAccumulatedJobTime: accumulatedJobTime}));
                    CommandHistory.log("Total accumulated job time: " + secToHMS(accumulatedJobTime), CommandHistory.SUCCESS);
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
            let serverVersion = 'not connected';
            dispatch(setSettingsAttrs({comServerVersion: serverVersion}));
        });

        socket.on('error', function (data) {
            CommandHistory.log('Server error: ' + data, CommandHistory.DANGER);
            //console.log('error: ' + data);
        });

    }
    
    handleDisconnectServer() {
        if (socket) {
            CommandHistory.log('Disconnecting from server', CommandHistory.INFO);
            socket.disconnect();
            let serverVersion = 'not connected';
            dispatch(setSettingsAttrs({comServerVersion: serverVersion}));
        }
    }
    
    handleConnectMachine() {
        var connectVia = this.props.settings.connectVia;
        var connectPort = this.props.settings.connectPort.trim();
        var connectBaud = this.props.settings.connectBaud;
        var connectIP = this.props.settings.connectIP;
        switch (connectVia) {
            case 'USB':
                CommandHistory.log('Connecting Machine @ ' + connectVia + ',' + connectPort + ',' + connectBaud + 'baud', CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectPort + ',' + connectBaud);
                break;
            case 'Telnet':
                CommandHistory.log('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                CommandHistory.log('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    }

    handleDisconnectMachine() {
        CommandHistory.log('Disconnecting Machine', CommandHistory.INFO);
        socket.emit('closePort');
    }

    
    render() {
        let {settings, dispatch} = this.props;
        
        return (
            <div style={{paddingTop: 2}}>
                <PanelGroup>
                    <Panel collapsible header="Server Connection" bsStyle="primary" eventKey="1" defaultExpanded={false}>
                        <TextField {...{ object: settings, field: 'comServerIP', setAttrs: setSettingsAttrs, description: 'Server IP' }} />
                        <ButtonGroup>
                            <Button id="connectS" bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectServer(e)}}><Icon name="share" /> Connect</Button>
                            <Button id="disconnectS" bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectServer(e)}}><Glyphicon glyph="trash" /> Disconnect</Button>
                        </ButtonGroup>
                    </Panel>

                    <Panel collapsible header="Machine Connection" bsStyle="primary" eventKey="2" defaultExpanded={true}>
                        <SelectField {...{ object: settings, field: 'connectVia', setAttrs: setSettingsAttrs, data: this.state.comInterfaces, defaultValue: '', description: 'Machine Connection', selectProps: { clearable: false } }} />
                        <Collapse in={settings.connectVia == 'USB'}>
                            <div>
                                <SelectField {...{ object: settings, field: 'connectPort', setAttrs: setSettingsAttrs, data: this.state.comPorts, defaultValue: '', description: 'USB / Serial Port', selectProps: { clearable: false } }} />
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

function secToHMS(sec) {
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor(sec / 60) % 60;
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    let seconds = sec % 60;
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
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
        $('#stopBtn .icon-top-text').html('clear');
        $('#stopBtn .icon-bot-text').html('alarm');
//        if ($('#alarmmodal').is(':visible')) {
//            // Nothing, its already open
//        } else {
//            //$('#alarmmodal').modal('show');
//        }
    } else if (state === 'Home') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").addClass('badge-busy');
        $('#stopBtn .icon-top-text').html('abort');
        $('#stopBtn .icon-bot-text').html('job');
//        if ($('#alarmmodal').is(':visible')) {
//            $('#alarmmodal').modal('hide');
//        }
    } else if (state === 'Hold') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").addClass('badge-warn');
        $("#machineStatus").removeClass('badge-busy');
        $('#stopBtn .icon-top-text').html('abort');
        $('#stopBtn .icon-bot-text').html('job');
        //$('#playBtn .icon-top-text').html('resume');
//        if ($('#alarmmodal').is(':visible')) {
//            $('#alarmmodal').modal('hide');
//        }
    } else if (state === 'Idle') {
        $("#machineStatus").addClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").removeClass('badge-busy');
        $('#stopBtn .icon-top-text').html('abort');
        $('#stopBtn .icon-bot-text').html('job');
        //$('#playBtn .icon-top-text').html('run');
//        if ($('#alarmmodal').is(':visible')) {
//            $('#alarmmodal').modal('hide');
//        }
    } else if (state === 'Run') {
        $("#machineStatus").removeClass('badge-ok');
        $("#machineStatus").removeClass('badge-notify');
        $("#machineStatus").removeClass('badge-warn');
        $("#machineStatus").addClass('badge-busy');
        $('#stopBtn .icon-top-text').html('abort');
        $('#stopBtn .icon-bot-text').html('job');
        //$('#playBtn .icon-top-text').html('pause');
//        if ($('#alarmmodal').is(':visible')) {
//            $('#alarmmodal').modal('hide');
//        }
    }
    $('#machineStatus').html(state);
}


export function runCommand(gcode) {
    if (serverConnected) {
        if (machineConnected){
            if (gcode) {
                //CommandHistory.log('Running Command', CommandHistory.INFO);
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
    if (serverConnected) {
        if (machineConnected){
            if (job.length > 0) {
                CommandHistory.log('Running Job', CommandHistory.INFO);
                playing = true;
                runStatus('running');
                $('#playicon').removeClass('fa-play');
                $('#playicon').addClass('fa-pause');
                jobStartTime = new Date(Date.now());
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

export function pauseJob() {
    console.log('pauseJob');
    if (serverConnected) {
        if (machineConnected){
            paused = true;
            runStatus('paused');
            $('#playicon').removeClass('fa-pause');
            $('#playicon').addClass('fa-play');
            socket.emit('pause');
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function resumeJob() {
    console.log('resumeJob');
    if (serverConnected) {
        if (machineConnected){
            paused = false;
            runStatus('running');
            $('#playicon').removeClass('fa-play');
            $('#playicon').addClass('fa-pause');
            socket.emit('resume');
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
            CommandHistory.log('Aborting job', CommandHistory.INFO);
            playing = false;
            paused = false;
            runStatus('stopped');
            $('#playicon').removeClass('fa-pause');
            $('#playicon').addClass('fa-play');
            socket.emit('stop');
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function clearAlarm(method) {
    console.log('clearAlarm');
    if (serverConnected) {
        if (machineConnected){
            CommandHistory.log('Resetting alarm', CommandHistory.INFO);
            socket.emit('clearAlarm', method);
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
            CommandHistory.log('Set ' + axis + ' Axis zero', CommandHistory.INFO);
            socket.emit('setZero', axis);
        } else {
            CommandHistory.log('Machine is not connected!', CommandHistory.DANGER);
        }
    } else {
        CommandHistory.log('Server is not connected!', CommandHistory.DANGER);
    }
}

export function gotoZero(axis) {
    if (serverConnected) {
        if (machineConnected){
            CommandHistory.log('Goto ' + axis + ' zero', CommandHistory.INFO);
            socket.emit('gotoZero', axis);
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

export function resetMachine() {
    if (serverConnected) {
        if (machineConnected){
            CommandHistory.log('Resetting Machine', CommandHistory.DANGER);
            socket.emit('resetMachine');
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
                    runStatus('running');
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
                    runStatus('paused');
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
    state => ({ settings: state.settings, comInterfaces: state.comInterfaces, comPorts: state.comPorts, documents: state.documents, gcode: state.gcode.content })
)(Com);

export default Com
