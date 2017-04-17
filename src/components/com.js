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

    componentDidMount() {
        if (!window.comms.isServerConnected()) 
            window.comms.connectServer();
    }

    handleConnectServer() {
        window.comms.connectServer();
    }

    handleDisconnectServer() {
        window.comms.disconnectServer();
    }

    handleConnectMachine() {

        let { connectVia, connectPort, connectBaud, connectIp} = this.props.settings;
        window.comms.connectMachine({ connectVia, connectPort, connectBaud, connectIp});
    }

    handleDisconnectMachine() {
        window.comms.disconnectMachine();
    }


    render() {
        let {settings, com, dispatch} = this.props;
        
        return (
            <div style={{paddingTop: 2}}>
                <PanelGroup>
                    <Panel collapsible header="Server Connection" bsStyle="primary" eventKey="1" defaultExpanded={false}>
                        <TextField {...{ object: settings, field: 'comServerIP', setAttrs: setSettingsAttrs, description: 'Server IP' }} />
                        <ButtonGroup>
                            <Button id="connectS" bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectServer(e)}} disabled={com.serverConnected}><Icon name="share" /> Connect</Button>
                            <Button id="disconnectS" bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectServer(e)}} disabled={!com.serverConnected}><Glyphicon glyph="trash" /> Disconnect</Button>
                        </ButtonGroup>
                    </Panel>

                    <Panel collapsible header="Machine Connection" bsStyle="primary" eventKey="2" defaultExpanded={true}>
                        <SelectField {...{ object: settings, field: 'connectVia', setAttrs: setSettingsAttrs, data: this.props.com.comInterfaces, defaultValue: '', description: 'Machine Connection', selectProps: { clearable: false } }} />
                        <Collapse in={settings.connectVia == 'USB'}>
                            <div>
                                <SelectField {...{ object: settings, field: 'connectPort', setAttrs: setSettingsAttrs, data: this.props.com.comPorts, defaultValue: '', description: 'USB / Serial Port', selectProps: { clearable: false } }} />
                                <SelectField {...{ object: settings, field: 'connectBaud', setAttrs: setSettingsAttrs, data: ['250000', '230400', '115200', '57600', '38400', '19200', '9600'], defaultValue: '115200', description: 'Baudrate', selectProps: { clearable: false } }} />
                            </div>
                        </Collapse>
                        <Collapse in={settings.connectVia != 'USB'}>
                            <div>
                                <TextField {...{ object: settings, field: 'connectIP', setAttrs: setSettingsAttrs, description: 'Machine IP' }} />
                            </div>
                        </Collapse>
                        <ButtonGroup>
                            <Button id="connect" bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleConnectMachine(e)}} disabled={com.machineConnected}><Icon name="share" /> Connect</Button>
                            <Button id="disconnect" bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDisconnectMachine(e)}} disabled={!com.machineConnected}><Glyphicon glyph="trash" /> Disconnect</Button>
                        </ButtonGroup>
                    </Panel>
                </PanelGroup>
            </div>
        )

    }
}

export function runCommand(gcode) {
    return window.comms.runCommand(gcode);
}

export function runJob(job) {
    return window.comms.runJob(job);
}

export function pauseJob() {
    return window.comms.pauseJob();
}

export function resumeJob() {
    return window.comms.resumeJob();
}

export function abortJob() {
    return window.comms.abortJob();
}

export function clearAlarm(method) {
    return window.comms.clearAlarm(method);
}

export function setZero(axis) {
    return window.comms.setZero(axis);
}

export function gotoZero(axis) {
    return window.comms.gotoZero(axis);
}

export function laserTest(power, duration, maxS) {
    return window.comms.laserTest(power, duration, maxS);
}

export function jog(axis, dist, feed) {
    return window.comms.jog(axis, dist, feed);
}

export function feedOverride(step) {
    return window.comms.feedOverride(step)
}

export function spindleOverride(step) {
    return window.comms.spindleOverride(step)
}

export function resetMachine() {
    return window.comms.resetMachine()
}

export function playpauseMachine() {
     return window.comms.playpauseMachine()
}

Com = connect(
    state => ({ settings: state.settings, documents: state.documents, gcode: state.gcode.content, com: state.com })
)(Com);

export default Com
