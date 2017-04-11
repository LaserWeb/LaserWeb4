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


export function secToHMS(sec) {
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


class commClient {

    constructor(props) {
        this.props = props;
    }

    isServerConnected()
    {
        return this.props.com.serverConnected;
    }

    isMachineConnected()
    {
        return this.props.com.machineConnected;
    }

    connectServer(server) {

        if (!server)
            server = this.props.settings.comServerIP;

        this.socket = io('ws://' + server);

        const socket = this.socket;

        CommandHistory.write('Connecting to Server @ ' + server, CommandHistory.INFO);

        socket.on('connect', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { command: 'connect', attrs: { serverConnected: true } } })
            socket.emit('firstload');
            socket.emit('getServerConfig');
            CommandHistory.write('Server connected', CommandHistory.SUCCESS);
        }.bind(this));

        socket.on('disconnect', function () {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { command: 'disconnect', attrs: { serverConnected: false, machineConnected: false } } })
            CommandHistory.error('Disconnected from Server ' + this.props.settings.comServerIP)
        }.bind(this));

        socket.on('serverConfig', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: {  command: 'serverConfig', serverConnected: true, comServerVersion: data.serverVersion } } })
            console.log('serverVersion: ' + data.serverVersion);
        }.bind(this));

        socket.on('interfaces', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { command: 'interfaces', attrs: { serverConnected: true } } })
            if (data.length > 0) {
                let interfaces = [...data]
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { command: 'interfaces', attrs: { comInterfaces: interfaces } } })
                console.log('interfaces: ' + interfaces);
            } else {
                CommandHistory.error('No supported interfaces found on server!')
            }
        }.bind(this));

        socket.on('ports', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
            if (data.length > 0) {
                let ports = data.map(i => i.comName)
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { comPorts: ports } } })
                this.props.dispatch(setSettingsAttrs({ comPorts: ports }));
                console.log('ports: ' + ports);
            } else {
                CommandHistory.error('No serial ports found on server!')
            }
        }.bind(this));

        socket.on('activeInterface', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
            if (data.length > 0) {
                //set the actual interface
            }
            console.log('activeInterface: ' + data);
        }.bind(this));

        socket.on('activePort', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
            if (data.length > 0) {
                //set the actual port
            }
            console.log('activePorts: ' + data);
        }.bind(this));

        socket.on('activeBaudRate', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
            if (data.length > 0) {
                //set the actual baudrate
            }
            console.log('activeBaudrate: ' + data);
        }.bind(this));

        socket.on('activeIP', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
            if (data.length > 0) {
                //set the actual machine IP
            }
            console.log('activeIP: ' + data);
        }.bind(this));

        socket.on('connectStatus', function (data) {
            console.log('connectStatus: ' + data);
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })

            if (data.indexOf('opened') >= 0) {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { machineConnected: true } } })
                CommandHistory.write('Machine connected', CommandHistory.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { machineConnected: false } } })
                CommandHistory.error('Machine disconnected')
            }
        }.bind(this));

        socket.on('firmware', function (data) {
            console.log('firmware: ' + JSON.stringify(data));

            let attrs = {
                serverConnected: true,
                machineConnected: true,
                machineFirmware: { firmware: data.firmware, version: data.version, date: data.date },
            }

            CommandHistory.write(`Firmware ${data.firmware} ${data.version} detected`, CommandHistory.SUCCESS)
            if (data.version < '1.1e') {
                CommandHistory.error('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e')
                socket.emit('closePort', 1);
                attrs.machineConnected = false
            }

            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs } })
        }.bind(this));

        socket.on('runningJob', function (data) {
            CommandHistory.write('runningJob(' + data.length + ')', CommandHistory.WARN);
        }.bind(this));

        socket.on('runStatus', function (status) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { status } } })
            console.log('runStatus: ' + status);
            if (status === 'running') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: true, paused: false } } })
            } else if (status === 'paused') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: true } } })
            } else if (status === 'resumed') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false } } })
            } else if (status === 'stopped') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: false, paused: false } } })
            } else if (status === 'finished') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: false, paused: false } } })
            } else if (status === 'alarm') {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: false, paused: false } } })
                CommandHistory.error('ALARM!')
            }
            this.runStatus(status);
        }.bind(this));

        socket.on('data', function (data) {
            if (!this.props.com.machineConnected || !this.props.com.serverConnected)
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { machineConnected: true, serverConnected: true } } })

            if (data) {
                if (data.indexOf('<') === 0) {
                    this.updateStatus(data);
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
        }.bind(this));

        socket.on('wPos', function (wpos) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true, machineConnected: true } } })
            let { x, y, z } = wpos; //var pos = wpos.split(',');
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
                this.props.dispatch(setWorkspaceAttrs({ workPos: [xpos, ypos, zpos] }));
            }
        }.bind(this));

        // feed override report (from server)
        socket.on('feedOverride', function (data) {
            if (this.props.com.feedOverride!==data.toString())
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true, feedOverride: data.toString() } } })
        }.bind(this));

        // spindle override report (from server)
        socket.on('spindleOverride', function (data) {
            if (this.props.com.spindleOverride!==data.toString())
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true, spindleOverride: data.toString() } } })
        }.bind(this));

        // real feed report (from server)
        socket.on('realFeed', function (data) {
            if (this.props.com.serverConnected!==true){
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
                console.log('realFeed ' + data);
            }
        }.bind(this));

        // real spindle report (from server)
        socket.on('realSpindle', function (data) {
            if (this.props.com.serverConnected!==true){
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true } } })
                console.log('realSpindle ' + data);
            }
        }.bind(this));

        // laserTest state
        socket.on('laserTest', function (data) {
            let attrs = { serverConnected: true }
            if (data > 0) {
                attrs.laserTestOn = true;
            } else if (data === 0) {
                attrs.laserTestOn = false;
            }

            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs } })
        }.bind(this));

        socket.on('qCount', function (data) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: true, queued: parseInt(data) } } })

            if (this.props.com.playing && data === 0) {
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: false, paused: false } } })
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
                    this.props.dispatch(setSettingsAttrs({ jogAccumulatedJobTime: accumulatedJobTime }));
                    CommandHistory.write("Total accumulated job time: " + secToHMS(accumulatedJobTime), CommandHistory.SUCCESS);
                }
            }
        }.bind(this));

        socket.on('close', function () {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { serverConnected: false, machineConnected: false } } })
            CommandHistory.error('Server connection closed')
            let serverVersion = 'not connected';
            this.props.dispatch(setSettingsAttrs({ comServerVersion: serverVersion }));
        }.bind(this));

        socket.on('error', function (data) {
            CommandHistory.error('Server error: ' + data)
        }.bind(this));
    }

    disconnectServer() {
        if (this.socket) {
            CommandHistory.write('Disconnecting from server', CommandHistory.INFO);
            this.socket.disconnect();
            this.socket = null;
            this.props.dispatch(setSettingsAttrs({ comServerVersion: 'not connected' }));
        }
    }

    connectMachine({ connectVia, connectPort, connectBaud, connectIp}) {
        switch (connectVia) {
            case 'USB':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectPort.trim() + ',' + connectBaud + 'baud', CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectPort.trim() + ',' + connectBaud);
                break;
            case 'Telnet':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    }

    disconnectMachine() {
        if (this.socket) {
            CommandHistory.write('Disconnecting Machine', CommandHistory.INFO);
            this.socket.emit('closePort');
        }
    }

    __emit(caption, command, args = []) {
        if (this.props.com.serverConnected) {
            if (this.props.com.machineConnected) {
                CommandHistory.write(caption, CommandHistory.INFO);
                this.socket.emit(command,[...args].join(','))
                return true;
            } else {
                CommandHistory.error('Machine is not connected!')
                return false;
            }
        } else {
            CommandHistory.error('Server is not connected!')
            return false;
        }
    }

    getServerConfig()
    {
        return this.__emit("Refresh config", 'getServerConfig');
    }

    runCommand(gcode) {
        return this.__emit("Run Command", 'runCommand', [gcode])
    }

    runJob(job) {

        if (!job.length) {
            CommandHistory.error('Job empty!')
            return false;
        }

        if (this.__emit("Running Job", 'runJob', [job])) {
            this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { playing: true, jobStartTime: new Date(Date.now()).toJSON() } } })
            return true;
        }

        return false;

    }

    pauseJob() {
        if (this.__emit("Pause Job", 'pause')) {
            if (!this.props.com.paused)
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: true } } })

            this.runStatus('paused');
            return true;
        }
        return false;
    }

    resumeJob() {

        if (this.__emit("Resume Job", 'resume')) {
            if (this.props.com.paused)
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false } } })

            this.runStatus('running');
            return true;
        }
        return false;
    }

    abortJob() {
 
        if (this.__emit("Abort Job", 'stop')) {
            if (this.props.com.paused || this.props.com.playing)
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false, playing: false } } })
            this.runStatus('stopped');
            return true;
        }
        return false;
    }

    clearAlarm(method) {
        return this.__emit('Resetting alarm', 'clearAlarm', [method])
    }

    setZero(axis) {
        return this.__emit('Set ' + axis + ' Axis zero', 'setZero', [axis])
    }

    gotoZero(axis) {
        return this.__emit('Goto ' + axis + ' Axis zero', 'gotoZero', [axis])
    }

    laserTest(power, duration, maxS) {
        return this.__emit('Laser Test(' + power + ', ' + duration + ', ' + maxS + ')', 'laserTest', [power, duration, maxS])
    }

    jog(axis, dist, feed) {
        return this.__emit('Jog(' + axis + ', ' + dist + ', ' + feed + ')', 'jog', [axis, dist, feed])
    }

    jogTo(x,y,z,feed) {
        console.error("need to implement")
    }

    feedOverride(step) {
        return this.__emit('feedOverride(' + step + ')', 'feedOverride', [step])
    }

    spindleOverride(step) {
        return this.__emit('spindleOverride(' + step + ')', 'spindleOverride', [step])
    }

    resetMachine() {
        return this.__emit('Reset Machine', 'resetMachine')
        /// @cprezzi Should call abortJob??
    }

    playpauseMachine() {
        if (this.props.com.serverConnected) {
            if (this.props.com.machineConnected) {
                if (this.props.com.playing === true) {
                    if (this.props.com.paused === true) {
                        // unpause ???
                        var laseroncmd = document.getElementById('laseron').value;
                        if (laseroncmd.length === 0) {
                            laseroncmd = 0;
                        }
                        this.socket.emit('resume', laseroncmd);
                        this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false } } })
                        this.runStatus('running');

                        // end ifPaused
                    } else {
                        // pause ???
                        var laseroffcmd = document.getElementById('laseroff').value;
                        if (laseroffcmd.length === 0) {
                            laseroffcmd = 0;
                        }
                        this.socket.emit('pause', laseroffcmd);
                        this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: true } } })
                        this.runStatus('paused');
                    }
                    // end isPlaying
                } else {
                    this.playGcode();    //???
                }
                // end isConnected
            } else {
                CommandHistory.error('Machine is not connected!')
            }
        } else {
            CommandHistory.error('Server is not connected!')
        }
    }


    runStatus(status) {
        
        return;  //not needed anymore???
       

        switch (status) {

            case 'running':
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: true, playing: true } } })
            case 'paused':
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: true } } })
            case 'resumed':
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false } } })
            case 'stopped':
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false, playing: false } } })
            case 'finished':
                this.props.dispatch({ type: 'COM_SET_ATTRS', payload: { attrs: { paused: false, playing: false } } })
            // case 'alarm':

        }

    }

    updateStatus(data) {

        return;  //not needed anymore??? style should be moved to own component bindings of state.

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
            $('#stopIcon').removeClass('fa-stop');
            $('#stopIcon').addClass('fa-unlock');
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
            $('#stopIcon').removeClass('fa-unlock');
            $('#stopIcon').addClass('fa-stop');
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
            $('#stopIcon').removeClass('fa-unlock');
            $('#stopIcon').addClass('fa-stop');
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
            $('#stopIcon').removeClass('fa-unlock');
            $('#stopIcon').addClass('fa-stop');
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
            $('#stopIcon').removeClass('fa-unlock');
            $('#stopIcon').addClass('fa-stop');
            //$('#playBtn .icon-top-text').html('pause');
    //        if ($('#alarmmodal').is(':visible')) {
    //            $('#alarmmodal').modal('hide');
    //        }
        }
        $('#machineStatus').html(state);
    }


}

export default commClient;