// Copyright 2014, 2016 Claudio Prezzi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

import io from 'socket.io-client';
import { connect } from 'react-redux';
import CommandHistory from '../components/command-history'

import { setSettingsAttrs } from '../actions/settings'

class commClient
{
    
    constructor(props)
    {
        this.props = props;
        this.connectServer(this.props.settings.comServerIP)
    }

    connectServer(server)
    {
        this.socket = io('ws://' + server);
        
        const socket = this.socket;
        const that = this

        CommandHistory.write('Connecting to Server @ ' + server, CommandHistory.INFO);

        socket.on('connect', function(data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            socket.emit('firstload');
            socket.emit('getServerConfig');
            CommandHistory.write('Server connected', CommandHistory.SUCCESS);
        });

        socket.on('disconnect', function() {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: false, machineConnected:false}}})
            CommandHistory.error('Disconnected from Server ' + settings.comServerIP)
        });

        socket.on('serverConfig', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            that.props.dispatch(setSettingsAttrs({comServerVersion: data.serverVersion}));
            console.log('serverVersion: ' + data.serverVersion);
        });

        socket.on('interfaces', function(data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                let interfaces = [...data]
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {comInterfaces: interfaces}}})
                that.props.dispatch(setSettingsAttrs({comInterfaces: interfaces}));
                console.log('interfaces: ' + interfaces);
            } else {
                CommandHistory.error('No supported interfaces found on server!')
            }
        });

        socket.on('ports', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                let ports = data.map(i=>i.comName)
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {comPorts: ports}}})
                that.props.dispatch(setSettingsAttrs({comPorts: ports}));
                console.log('ports: ' + ports);
            } else {
                CommandHistory.error('No serial ports found on server!')
            }
        });

        socket.on('activeInterface', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                //set the actual interface
            }
            console.log('activeInterface: ' + data);
        });

        socket.on('activePort', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                //set the actual port
            }
            console.log('activePorts: ' + data);
        });

        socket.on('activeBaudRate', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                //set the actual baudrate
            }
            console.log('activeBaudrate: ' + data);
        });

        socket.on('activeIP', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            if (data.length > 0) {
                //set the actual machine IP
            }
            console.log('activeIP: ' + data);
        });

        socket.on('connectStatus', function (data) {
            console.log('connectStatus: ' + data);
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})

            if (data.indexOf('opened') >= 0) {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {machineConnected: true}}})
                CommandHistory.write('Machine connected', CommandHistory.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {machineConnected: false}}})
                CommandHistory.error('Machine disconnected')
            }
        });

        socket.on('firmware', function (data) {
            console.log('firmware: ' + data.join(' '));
            
            let attrs={
                serverConnected: true, 
                machineConnected:true,
                machineFirmware: {firmware: data.firmware, version: data.version, date: data.date },
            }
            
            CommandHistory.write(`Firmware ${data.firmware} ${data.version} detected`, CommandHistory.SUCCESS)
            if (data.version < '1.1e') {
                CommandHistory.error('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e')
                socket.emit('closePort', 1);
                attrs.machineConnected = false
            }

            that.props.dispatch({type: 'COM_SET_ATTRS', payload: { attrs }})
        });

        socket.on('runningJob', function (data) {
            CommandHistory.write('runningJob(' + data.length + ')', CommandHistory.WARN);
        });

        socket.on('runStatus', function (status) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {status}}})
            console.log('runStatus: ' + status);
            if (status === 'running') {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {playing: true, paused:false}}})
            } else if (status === 'paused') {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {paused:true}}})
            } else if (status === 'resumed') {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {paused:false}}})
            } else if (status === 'stopped') {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {playing: false, paused:false}}})
            } else if (status === 'finished') {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {playing: false, paused:false}}})
            } else if (status === 'alarm') {
                CommandHistory.error('ALARM!')
            }
            runStatus(status);
        });

        socket.on('data', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {playing: true, paused:true}}})
            if (data) {
                if (data.indexOf('<') === 0) {
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
                    CommandHistory.write(data, style);
                }
            }
        });

        socket.on('wPos', function (wpos) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true, machineConnected:true}}})
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
                $('#mX').html(xpos);
                $('#mY').html(ypos);
                $('#mZ').html(zpos);
                dispatch(setWorkspaceAttrs({ workPos: [xpos, ypos, zpos] }));
            }
        });

        // feed override report (from server)
        socket.on('feedOverride', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true, feedOverride: data.toString()}}})
        });

        // spindle override report (from server)
        socket.on('spindleOverride', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true, spindleOverride: data.toString()}}})
        });

        // real feed report (from server)
        socket.on('realFeed', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            //CommandHistory.write('realFeed: ' + data, CommandHistory.STD);
            //console.log('realFeed ' + data);
            //$('#mF').html(data);
        });

        // real spindle report (from server)
        socket.on('realSpindle', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true}}})
            //CommandHistory.write('realSpindle: ' + data, CommandHistory.STD);
            //console.log('realSpindle ' + data);
            //$('#mS').html(data);
        });

        // laserTest state
        socket.on('laserTest', function (data) {
            let attrs={serverConnected: true}
            if (data > 0){
                attrs.laserTestOn = true;
            } else if (data === 0) {
                attrs.laserTestOn = false;
            }

            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs}})
        });

        socket.on('qCount', function (data) {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: true, queued: parseInt(data)}}})

            if (playing && data === 0) {
                that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {playing: false, paused:false}}})
                this.runStatus('stopped');

                if (jobStartTime >= 0) {
                    var jobFinishTime = new Date(Date.now());
                    var elapsedTimeMS = jobFinishTime.getTime() - jobStartTime.getTime();
                    var elapsedTime = Math.round(elapsedTimeMS / 1000);
                    CommandHistory.write("Job started at " + jobStartTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Job finished at " + jobFinishTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Elapsed time: " + secToHMS(elapsedTime), CommandHistory.SUCCESS);
                    jobStartTime = -1;
                    let accumulatedJobTime = settings.jogAccumulatedJobTime + elapsedTime;
                    dispatch(setSettingsAttrs({jogAccumulatedJobTime: accumulatedJobTime}));
                    CommandHistory.write("Total accumulated job time: " + secToHMS(accumulatedJobTime), CommandHistory.SUCCESS);
                }
            }
        });

        socket.on('close', function() {
            that.props.dispatch({type: 'COM_SET_ATTRS', payload: {attrs: {serverConnected: false, machineConnected: false}}})
            CommandHistory.error('Server connection closed')
            let serverVersion = 'not connected';
            dispatch(setSettingsAttrs({comServerVersion: serverVersion}));
        });

        socket.on('error', function (data) {
            CommandHistory.error('Server error: ' + data)
        });
    }

    disconnectServer() {
        if (this.socket) {
            CommandHistory.write('Disconnecting from server', CommandHistory.INFO);
            this.socket.disconnect();
            this.socket = null;
            let serverVersion = 'not connected';
            dispatch(setSettingsAttrs({comServerVersion: serverVersion}));
        }
    }

    connectMachine() {
        var connectVia = this.props.settings.connectVia;
        var connectPort = this.props.settings.connectPort.trim();
        var connectBaud = this.props.settings.connectBaud;
        var connectIP = this.props.settings.connectIP;
        switch (connectVia) {
            case 'USB':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectPort + ',' + connectBaud + 'baud', CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectPort + ',' + connectBaud);
                break;
            case 'Telnet':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    }

    disconnectMachine() {
        if (this.socket) {
            CommandHistory.write('Disconnecting Machine', CommandHistory.INFO);
            this.socket.emit('closePort');
        }
    }

    runCommand()
    {

    }

    runJob()
    {

    }

    pauseJob()
    {

    }

    resumeJob()
    {

    }

    abortJob()
    {

    }

    clearAlarm(){

    }

    setZero(){

    }

    gotoZero(){

    }

    laserTest(){

    }
    
    jog()
    {

    }

    feedOverride()
    {

    }

    splindleOverride()
    {

    }

    resetMachine()
    {

    }

    playpauseMachine(){

    }
}

export default commClient;