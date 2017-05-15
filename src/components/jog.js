/**
 * Jog module.
 * @module
 */

// React
import React from 'react'
import { connect } from 'react-redux';
import keydown, { Keys } from 'react-keydown';

import { PanelGroup, Panel, ProgressBar} from 'react-bootstrap';

import { setSettingsAttrs } from '../actions/settings';
import { setWorkspaceAttrs } from '../actions/workspace';

import CommandHistory from './command-history';

import { Input, TextField, NumberField, ToggleField, SelectField } from './forms';
import { runCommand, runJob, pauseJob, resumeJob, abortJob, clearAlarm, setZero, gotoZero, checkSize, laserTest, jog, jogTo, feedOverride, spindleOverride, resetMachine } from './com.js';
import { MacrosBar } from './macros';

import '../styles/index.css'
import Icon from './font-awesome'
import Toggle from 'react-toggle';
import { Label } from 'react-bootstrap'

var ovStep = 1;
var ovLoop;
var playing = false;
var paused = false;

$('body').on('keydown', function (ev) {
    if (ev.keyCode === 17) {
        //CTRL key down > set override stepping to 10
        ovStep = 10;
    }
});

$('body').on('keyup', function (ev) {
    if (ev.keyCode === 17) {
        //CTRL key released-> reset override stepping to 1
        ovStep = 1;
    }
});

let liveJoggingState = { hasHomed: false, active: false, disabled: true }

/**
 * Jog component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Jog extends React.Component {

    constructor(props) {
        super(props);
        let { jogStepsize, jogFeedXY, jogFeedZ, machineZEnabled, machineAEnabled } = this.props.settings;
        this.state = {
            jogStepsize: jogStepsize,
            jogFeedXY: jogFeedXY,
            jogFeedZ: jogFeedZ,

            liveJogging: liveJoggingState,

            isPlaying: playing,
            isPaused: paused,
            
            machineZEnabled: machineZEnabled,
            machineAEnabled: machineAEnabled,
        };
    }

    componentWillUnmount() {
        liveJoggingState = this.state.liveJogging;
    }

    @keydown('alt+right')
    jogRight(event) {
        event.preventDefault();
        this.jog('X', '+')
    }

    @keydown('alt+left')
    jogLeft(event) {
        event.preventDefault();
        this.jog('X', '-')
    }

    @keydown('alt+up')
    jogUp(event) {
        event.preventDefault();
        this.jog('Y', '+')
    }

    @keydown('alt+down')
    jogDown(event) {
        event.preventDefault();
        this.jog('Y', '-')
    }

    @keydown('ctrl+alt+up')
    jogZUp(event) {
        event.preventDefault();
        this.jog('Z', '+')
    }

    @keydown('ctrl+alt+down')
    jogZDown(event) {
        event.preventDefault();
        this.jog('Z', '-')
    }

    @keydown('ctrl+alt+right')
    jogAplus(event) {
        event.preventDefault();
        this.jog('A', '+')
    }

    @keydown('ctrl+alt+left')
    jogAminus(event) {
        event.preventDefault();
        this.jog('A', '-')
    }

    @keydown('ctrl+x')
    keylogger( event ) {
        event.preventDefault();
        resetMachine();
    }

    homeAll() {
        console.log('homeAll');
        let cmd = this.props.settings.gcodeHoming;

        if (!this.state.isPlaying)
            this.setState({ liveJogging: { ... this.state.liveJogging, hasHomed: true, disabled: false } })

        runCommand(cmd);
    }

    runCommand(e) {
        console.log('runCommand ' + e);
        runCommand(e);
    }

    runJob() {
        if (!playing) {
            let cmd = this.props.gcode;
            //alert(cmd);
            console.log('runJob(' + cmd.length + ')');
            playing = true;

            this.setState({
                isPlaying: true,
                liveJogging: {
                    ... this.state.liveJogging, disabled: true, hasHomed: false
                }
            })

            runJob(cmd);
        } else {
            if (!paused) {
                console.log('pauseJob');
                paused = true;
                this.setState({ isPaused: true })
                pauseJob();
            } else {
                console.log('resumeJob');
                paused = false;
                this.setState({ isPaused: false })
                resumeJob();
            }
        }
    }

    pauseJob() {
        console.log('pauseJob');
        let cmd = this.props.settings.gcodeToolOff;
        pauseJob();
    }

    resumeJob() {
        console.log('resumeJob');
        let cmd = this.props.settings.gcodeToolOn;
        resumeJob();
    }

    abortJob() {
        if ($('#machineStatus').html() == 'Alarm') {
            console.log('clearAlarm');
            clearAlarm(2);
        } else if ($('#machineStatus').html() == 'Idle' && !paused) {
            console.log('abort ignored, because state is idle');
        } else {
            console.log('abortJob');
            paused = false;
            playing = false;
            this.setState({ isPaused: false, isPlaying: false })
            abortJob();
        }
    }

    setZero(axis) {
        console.log('setZero(' + axis + ')');
        setZero(axis);
    }

    gotoZero(axis) {
        console.log('gotoZero(' + axis + ')');
        gotoZero(axis);
    }

    checkSize() {
        console.log('checkSize');
        let feedrate = $('#jogfeedxy').val() * 60;
        let gcode = this.props.gcode;
        
        //let linemoves = gcode.split(/g[13]/i);
        
        let xArray = gcode.split(/x/i);
        //alert(xArray.toString());
        let xMin = 0;
        let xMax = 0;
        for (let i = 0; i < xArray.length; i++) {
            if (parseFloat(xArray[i]) < xMin) {
                xMin = parseFloat(xArray[i]);
            }
            if (parseFloat(xArray[i]) > xMax) {
                xMax = parseFloat(xArray[i]);
            }
        }
        let yArray = gcode.split(/y/i);
        let yMin = 0;
        let yMax = 0;
        for (let i = 0; i < yArray.length; i++) {
            if (parseFloat(yArray[i]) < yMin) {
                yMin = parseFloat(yArray[i]);
            }
            if (parseFloat(yArray[i]) > yMax) {
                yMax = parseFloat(yArray[i]);
            }
        }
        let power = this.props.settings.gcodeCheckSizePower / 100 * this.props.settings.gcodeSMaxValue;
        let moves = `
            G90\n
            G0 X` + xMin + ` Y` + yMin + ` F` + feedrate + `\n
            G1 F` + feedrate + ` S` + power + `\n
            G1 X` + xMax + ` Y` + yMin + `\n
            G1 X` + xMax + ` Y` + yMax + `\n
            G1 X` + xMin + ` Y` + yMax + `\n
            G1 X` + xMin + ` Y` + yMin + `\n
            G90\n`;
        runCommand(moves);
    }

    laserTest() {
        console.log('laserTest');
        let power = this.props.settings.gcodeToolTestPower;
        let duration = this.props.settings.gcodeToolTestDuration;
        let maxS = this.props.settings.gcodeSMaxValue;
        console.log('laserTest(' + power + ',' + duration + ',' + maxS + ')');
        laserTest(power, duration, maxS);
    }

    jog(axis, dir) {
        let dist = this.props.settings.jogStepsize;
        let units = this.props.settings.toolFeedUnits;
        let feed, mult = 1, mode = 1;
        let x, y, z, a;
        if (dir === '+') {
            dir = '';
        }
        if (units == 'mm/s') mult = 60;
        switch (axis) {
            case 'X':
                x = dir + dist;
                feed = jQuery('#jogfeedxy').val() * mult;
                break;
            case 'Y':
                y = dir + dist;
                feed = jQuery('#jogfeedxy').val() * mult;
                break;
            case 'Z':
                z = dir + dist;
                feed = jQuery('#jogfeedz').val() * mult;
                break;
            case 'A':
                a = dir + dist;
                feed = jQuery('#jogfeedxy').val() * mult;
                break;
        }
        CommandHistory.log('jog(' + axis + ',' + dir + dist + ',' + feed + ')');
        jog(axis, dir + dist, feed);
        //CommandHistory.log('jogTo(' + x + ',' + y + ',' + z + ',' + mode + ',' + feed + ')');
        //jogTo(x, y, z, mode, feed);
    }

    changeJogFeedXY(e) {
        console.log('changeJogFeedXY');
        let that = this;
        that.setState({ jogFeedXY: e });
        let { dispatch } = this.props;
        dispatch(setSettingsAttrs({ jogFeedXY: e }));
    }

    changeJogFeedZ(e) {
        console.log('changeJogFeedZ');
        let that = this;
        that.setState({ jogFeedZ: e });
        let { dispatch } = this.props;
        dispatch(setSettingsAttrs({ jogFeedZ: e }));
    }

    changeStepsize(stepsize) {
        let that = this;
        that.setState({ jogStepsize: stepsize });
        let { dispatch } = this.props;
        dispatch(setSettingsAttrs({ jogStepsize: stepsize }));
        console.log('Jog will use ' + stepsize + ' mm per click');
        CommandHistory.write('Jog will use ' + stepsize + ' mm per click', CommandHistory.WARN);
        //$('.stepsizeval').empty();
        //$('.stepsizeval').html(stepsize + 'mm');
    }

    resetF() {
        console.log('resetFeedOverride');
        feedOverride(0);
    }

    increaseF() {
        console.log('increaseFeedOverride ' + ovStep);
        feedOverride(ovStep);
    }

    decreaseF() {
        console.log('decreaseFeedOverride ' + ovStep);
        feedOverride(-ovStep);
    }

    resetS() {
        console.log('resetSpindeOverride');
        spindleOverride(0);
    }

    increaseS() {
        console.log('increaseSpindleOverride ' + ovStep);
        spindleOverride(ovStep);
    }

    decreaseS() {
        console.log('decreaseSpindleOverride ' + ovStep);
        spindleOverride(-ovStep);
    }

     /**
     * Render the component.
     * @return {String}
     */
    render() {
        let { settings, dispatch } = this.props;
        const machineZEnabled = this.state.machineZEnabled;
        const machineAEnabled = this.state.machineAEnabled;

        return (
            <div style={{ paddingTop: 6 }} >
                        <span className="badge badge-default badge-notify" title="Items in Queue" id="machineStatus" style={{ marginRight: 5 }}>Not Connected</span>
                        <span className="badge badge-default badge-notify" title="Items in Queue" id="queueCnt" style={{ marginRight: 5 }}>Queued: 0</span>
                        <div id="mPosition" className="well well-sm" style={{ marginBottom: 7}}>
                            <div id="rX" className="drolabel">X:</div>
                            <div className="btn-group dropdown" style={{ marginLeft: -3 }}>
                                <button id="" type="button" className="btn btn-sm btn-default" style={{ padding: 2, top: -3, backgroundColor: '#ffdbdb' }} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="fa-stack fa-1x">
                                        <i className="fa fa-caret-down fa-stack-1x"></i>
                                    </span>
                                </button>
                                <ul className="dropdown-menu">
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b><br />NB: Manually jog to ensure other<br />axes are clear first</li>
                                    <li id="XProbeMin"><a href="#"><i className="fa fa-fw fa-arrow-right" aria-hidden="true"></i>Probe X Min</a></li>
                                    <li id="XProbeMax"><a href="#"><i className="fa fa-fw fa-arrow-left" aria-hidden="true"></i>Probe X Max</a></li>
                                    <li role="separator" className="divider"></li>
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                                    <li id="homeX"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home X Axis</a></li>
                                    <li id="zeroX"><a href="#" onClick={(e) => { this.setZero('x') }}><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set X Axis Zero</a></li>
                                    <li role="separator" className="divider"></li>
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                                    <li id="gotoXZero"><a href="#" onClick={(e) => { this.gotoZero('x') }}><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to X0</a></li>
                                </ul>
                            </div>
                            <div id="mX" className="droPos" style={{ marginRight: 0, backgroundColor: '#ffdbdb' }}>0.00</div><div className="droUnit" style={{ backgroundColor: '#ffdbdb' }}> mm</div>
                            <br />

                            <div id="rY" className="drolabel">Y:</div>
                            <div className="btn-group dropdown" style={{ marginLeft: -3 }}>
                                <button id="" type="button" className="btn btn-sm btn-default" style={{ padding: 2, top: -3, backgroundColor: '#dbffdf' }} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="fa-stack fa-1x">
                                        <i className="fa fa-caret-down fa-stack-1x"></i>
                                    </span>
                                </button>
                                <ul className="dropdown-menu">
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b><br />NB: Manually jog to ensure other<br />axes are clear first</li>
                                    <li id="YProbeMin"><a href="#"><i className="fa fa-fw fa-arrow-up" aria-hidden="true"></i>Probe Y Min</a></li>
                                    <li id="YProbeMax"><a href="#"><i className="fa fa-fw fa-arrow-down" aria-hidden="true"></i>Probe Y Max</a></li>
                                    <li role="separator" className="divider"></li>
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                                    <li id="homeY"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home Y Axis</a></li>
                                    <li id="zeroY"><a href="#" onClick={(e) => { this.setZero('y') }}><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set Y Axis Zero</a></li>
                                    <li role="separator" className="divider"></li>
                                    <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                                    <li id="gotoYZero"><a href="#" onClick={(e) => { this.gotoZero('y') }}><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to Y0</a></li>
                                </ul>
                            </div>
                            <div id="mY" className="droPos" style={{ marginRight: 0, backgroundColor: '#dbffdf' }}>0.00</div><div className="droUnit" style={{ backgroundColor: '#dbffdf' }}> mm</div>
                            <br />

                            {machineZEnabled && (
                                <div>
                                    <div id="rZ" className="drolabel">Z:</div>
                                    <div className="btn-group dropdown" style={{ marginLeft: -3 }}>
                                        <button id="" type="button" className="btn btn-sm btn-default" style={{ padding: 2, top: -3, backgroundColor: '#dbe8ff' }} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="fa-stack fa-1x">
                                                <i className="fa fa-caret-down fa-stack-1x"></i>
                                            </span>
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b><br />NB: Manually jog to ensure other<br />axes are clear first</li>
                                            <li id="ZProbeMin"><a href="#" ><i className="fa fa-fw fa-arrow-down" aria-hidden="true"></i>Probe Z Min</a></li>
                                            <li role="separator" className="divider"></li>
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                                            <li id="homeZ"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home Z Axis</a></li>
                                            <li id="zeroZ"><a href="#" onClick={(e) => { this.setZero('z') }}><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set Z Axis Zero</a></li>
                                            <li role="separator" className="divider"></li>
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                                            <li id="gotoZZero"><a href="#" onClick={(e) => { this.gotoZero('z') }}><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to Z0</a></li>
                                        </ul>
                                    </div>
                                    <div id="mZ" className="droPos" style={{ marginRight: 0, backgroundColor: '#dbe8ff' }}>0.00</div><div className="droUnit" style={{ backgroundColor: '#dbe8ff' }}> mm</div>
                                    <br />
                                </div>
                            )}

                            {machineAEnabled && (
                                <div>
                                    <div id="rA" className="drolabel">A:</div>
                                    <div className="btn-group dropdown" style={{ marginLeft: -3 }}>
                                        <button id="" type="button" className="btn btn-sm btn-default" style={{ padding: 2, top: -3, backgroundColor: '#fffbcf' }} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="fa-stack fa-1x">
                                                <i className="fa fa-caret-down fa-stack-1x"></i>
                                            </span>
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b><br />NB: Manually jog to ensure other<br />axes are clear first</li>
                                            <li id="AProbeMin"><a href="#"><i className="fa fa-fw fa-arrow-up" aria-hidden="true"></i>Probe A Min</a></li>
                                            <li id="AProbeMax"><a href="#"><i className="fa fa-fw fa-arrow-down" aria-hidden="true"></i>Probe A Max</a></li>
                                            <li role="separator" className="divider"></li>
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                                            <li id="homeA"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home A Axis</a></li>
                                            <li id="zeroA"><a href="#" onClick={(e) => { this.setZero('y') }}><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set A Axis Zero</a></li>
                                            <li role="separator" className="divider"></li>
                                            <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                                            <li id="gotoAZero"><a href="#" onClick={(e) => { this.gotoZero('a') }}><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to A0</a></li>
                                        </ul>
                                    </div>
                                    <div id="mA" className="droPos" style={{ marginRight: 0, backgroundColor: '#fffbcf' }}>0.00</div><div className="droUnit" style={{ backgroundColor: '#fffbcf' }}> mm</div>
                                    <br />
                                </div>
                            )}

                            <div id="overrides">
                                <div className="drolabel">F:</div>
                                <div id="oF" className="droOR">100<span className="drounitlabel"> %</span></div>
                                <div className="btn-group btn-override">
                                    <button id="rF" type="button" onClick={(e) => { this.resetF(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Reset F-Override to 100%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-retweet fa-stack-1x"></i>
                                        </span>
                                    </button>
                                    <button id="iF" type="button" onClick={(e) => { this.increaseF(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Increase by 1% or Ctrl+Click to increase by 10%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-arrow-up fa-stack-1x"></i>
                                        </span>
                                    </button>
                                    <button id="dF" type="button" onClick={(e) => { this.decreaseF(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Decrease by 1% or Ctrl+Click to decrease by 10%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-arrow-down fa-stack-1x"></i>
                                        </span>
                                    </button>
                                </div>
                                <br />
                                <div className="drolabel">S:</div>
                                <div id="oS" className="droOR">100<span className="drounitlabel"> %</span></div>
                                <div className="btn-group btn-override">
                                    <button id="rS" type="button" onClick={(e) => { this.resetS(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Reset S-Override to 100%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-retweet fa-stack-1x"></i>
                                        </span>
                                    </button>
                                    <button id="iS" type="button" onClick={(e) => { this.increaseS(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Increase by 1% or Ctrl+Click to increase by 10%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-arrow-up fa-stack-1x"></i>
                                        </span>
                                    </button>
                                    <button id="dS" type="button" onClick={(e) => { this.decreaseS(e) }} className="btn btn-sm btn-default" style={{ padding: 2, top: -3 }} data-toggle="tooltip" data-placement="bottom" title="Click to Decrease by 1% or Ctrl+Click to decrease by 10%">
                                        <span className="fa-stack fa-1x">
                                            <i className="fa fa-arrow-down fa-stack-1x"></i>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="well well-sm" style={{ marginBottom: 7}}>
                          <div id="controlmachine" className="btn-group" role="group" aria-label="controljob">
                              <div className="btn-group btn-group-justified">
                                  <div className="btn-group">
                                      <button type='button' id="homeAll" className="btn btn-ctl btn-default" onClick={(e) => { this.homeAll(e) }}>
                                          <span className="fa-stack fa-1x">
                                              <i className="fa fa-home fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">home</strong>
                                              <strong className="fa-stack-1x icon-bot-text">all</strong>
                                          </span>
                                      </button>
                                  </div>
                                  <div className="btn-group">
                                      <button type='button' id="playBtn" className="btn btn-ctl btn-default" onClick={(e) => { this.runJob(e) }}>
                                          <span className="fa-stack fa-1x">
                                              <i id="playicon" className="fa fa-play fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">run</strong>
                                              <strong className="fa-stack-1x icon-bot-text">job</strong>
                                          </span>
                                      </button>
                                  </div>
                                  <div className="btn-group" style={{ display: 'none' }}>
                                      <button type='button' id="uploadBtn" className="btn btn-ctl btn-default" onClick={(e) => { this.uploadSD(e) }}>
                                          <span className="fa-stack fa-1x">
                                              <i className="fa fa-hdd-o fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">upload</strong>
                                              <strong className="fa-stack-1x icon-bot-text">to SD</strong>
                                          </span>
                                      </button>
                                  </div>
                                  <div className="btn-group">
                                      <button type='button' id="stopBtn" className="btn btn-ctl btn-default" onClick={(e) => { this.abortJob(e) }}>
                                          <span className="fa-stack fa-1x">
                                              <i id="stopIcon" className="fa fa-stop fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">abort</strong>
                                              <strong className="fa-stack-1x icon-bot-text">job</strong>
                                          </span>
                                      </button>
                                  </div>
                                  <div className="btn-group">
                                      <button type='button' id="zeroAll" className="btn btn-ctl btn-default" onClick={(e) => { this.setZero('all') }}>
                                          <span className="fa-stack fa-1x">
                                              <i className="fa fa-crosshairs fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">set</strong>
                                              <strong className="fa-stack-1x icon-bot-text">zero</strong>
                                          </span>
                                      </button>
                                  </div>
                                  <div className="btn-group">
                                      <button type='button' id="bounding" className="btn btn-ctl btn-default" onClick={(e) => { this.checkSize(e) }}>
                                          <span className="fa-stack fa-1x">
                                              <i className="fa fa-square-o fa-stack-1x"></i>
                                              <strong className="fa-stack-1x icon-top-text">check</strong>
                                              <strong className="fa-stack-1x icon-bot-text">size</strong>
                                          </span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                        </div>
                        <div className="well well-sm" style={{ marginBottom: 7}}>
                            <table className='centerTable' style={{ width: 99 + '%' }}>
                                <tbody>
                                    <tr>
                                        <td>
                                            <button id="lT" type="button" data-title="Laser Test" className="btn btn-ctl btn-default" onClick={(e) => { this.laserTest(e) }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-fire fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">Laser</strong>
                                                    <strong className="fa-stack-1x icon-bot-text">Test</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <button style={{ backgroundColor: '#dbffdf' }} id="yP" type="button" data-title="Jog Y+" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('Y', '+') }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-arrow-up fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">Y+</strong>
                                                    <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <button id="motorsOff" type="button" data-title="Motors Off" className="btn btn-ctl btn-default" style={{ display: 'none' }} onClick={(e) => { this.motorsOff(e) }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-power-off fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">Motors</strong>
                                                    <strong className="fa-stack-1x icon-bot-text">Off</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td></td>
                                        {machineAEnabled && (
                                            <td>
                                                <button style={{ backgroundColor: '#fffbcf' }} id="aP" type="button" data-title="Jog A+" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('A', '+') }}>
                                                    <span className="fa-stack fa-1x"><i className="fa fa-arrow-up fa-stack-1x"></i>
                                                        <strong className="fa-stack-1x icon-top-text">A+</strong>
                                                        <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                    </span>
                                                </button>
                                            </td>
                                        )}
                                        {machineZEnabled && (
                                            <td>
                                                <button style={{ backgroundColor: '#dbe8ff' }} id="zP" type="button" data-title="Jog Z+" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('Z', '+') }}>
                                                    <span className="fa-stack fa-1x"><i className="fa fa-arrow-up fa-stack-1x"></i>
                                                        <strong className="fa-stack-1x icon-top-text">Z+</strong>
                                                        <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                    </span>
                                                </button>
                                            </td>
                                        )}
                                        {!machineZEnabled && (
                                            <td></td>
                                        )}
                                    </tr>
                                    <tr>
                                        <td>
                                            <button style={{ backgroundColor: '#ffdbdb' }} id="xM" type="button" data-title="Jog X-" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('X', '-') }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-arrow-left fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">X-</strong>
                                                    <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <button style={{ backgroundColor: '#dbffdf' }} id="yM" type="button" data-title="Jog Y-" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('Y', '-') }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-arrow-down fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">Y-</strong>
                                                    <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <button style={{ backgroundColor: '#ffdbdb' }} id="xP" type="button" data-title="Jog X+" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('X', '+') }}>
                                                <span className="fa-stack fa-1x">
                                                    <i className="fa fa-arrow-right fa-stack-1x"></i>
                                                    <strong className="fa-stack-1x icon-top-text">X+</strong>
                                                    <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ width: '8px' }}></div>
                                        </td>
                                        {machineAEnabled && (
                                            <td>
                                                <button style={{ backgroundColor: '#fffbcf' }} id="aM" type="button" data-title="Jog A-" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('A', '-') }}>
                                                    <span className="fa-stack fa-1x">
                                                        <i className="fa fa-arrow-down fa-stack-1x"></i>
                                                        <strong className="fa-stack-1x icon-top-text">A-</strong>
                                                        <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                    </span>
                                                </button>
                                            </td>
                                        )}
                                        {machineZEnabled && (
                                            <td>
                                                <button style={{ backgroundColor: '#dbe8ff' }} id="zM" type="button" data-title="Jog Z-" className="btn btn-ctl btn-default" onClick={(e) => { this.jog('Z', '-') }}>
                                                    <span className="fa-stack fa-1x">
                                                        <i className="fa fa-arrow-down fa-stack-1x"></i>
                                                        <strong className="fa-stack-1x icon-top-text">Z-</strong>
                                                        <strong className="fa-stack-1x stepsizeval icon-bot-text">{this.state.jogStepsize}mm</strong>
                                                    </span>
                                                </button>
                                            </td>
                                        )}
                                        {!machineZEnabled && (
                                            <td></td>
                                        )}
                                    </tr>
                                    <tr>
                                        <td colSpan="5">
                                            <form id="stepsize" >
                                                <div data-toggle="buttons">
                                                    <label style={{ backgroundColor: '#F5F5F5' }} className="btn btn-jog btn-default" onClick={(e) => { this.changeStepsize(0.1) }} >
                                                        <input type="radio" name="stp" defaultValue="0.1" />
                                                        <span className="fa-stack fa-1x">
                                                            <i className="fa fa-arrows-h fa-stack-1x"></i>
                                                            <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                                            <strong className="fa-stack-1x icon-bot-text">0.1mm</strong>
                                                        </span>
                                                    </label>
                                                    <label style={{ backgroundColor: '#F0F0F0' }} className="btn btn-jog btn-default" onClick={(e) => { this.changeStepsize(1) }} >
                                                        <input type="radio" name="stp" defaultValue="1" />
                                                        <span className="fa-stack fa-1x">
                                                            <i className="fa fa-arrows-h fa-stack-1x"></i>
                                                            <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                                            <strong className="fa-stack-1x icon-bot-text">1mm</strong>
                                                        </span>
                                                    </label>
                                                    <label style={{ backgroundColor: '#E8E8E8' }} className="btn btn-jog btn-default" onClick={(e) => { this.changeStepsize(10) }} >
                                                        <input type="radio" name="stp" defaultValue="10" />
                                                        <span className="fa-stack fa-1x">
                                                            <i className="fa fa-arrows-h fa-stack-1x"></i>
                                                            <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                                            <strong className="fa-stack-1x icon-bot-text">10mm</strong>
                                                        </span>
                                                    </label>
                                                    <label style={{ backgroundColor: '#E0E0E0' }} className="btn btn-jog btn-default" onClick={(e) => { this.changeStepsize(100) }} >
                                                        <input type="radio" name="stp" defaultValue="100" />
                                                        <span className="fa-stack fa-1x">
                                                            <i className="fa fa-arrows-h fa-stack-1x"></i>
                                                            <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                                            <strong className="fa-stack-1x icon-bot-text">100mm</strong>
                                                        </span>
                                                    </label>
                                                </div>
                                            </form>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5">
                                            <div className="input-group">
                                                <span className="input-group-addon">X/Y Jog</span>
                                                <Input id="jogfeedxy" type="number" className="form-control numpad input-sm text-right" value={this.state.jogFeedXY} onChangeValue={(e) => { this.changeJogFeedXY(e) }} />
                                                <span className="input-group-addon"><small>{settings.toolFeedUnits}</small></span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5">
                                            <div className="input-group">
                                                <span className="input-group-addon">Z Jog </span>
                                                <Input id="jogfeedz" type="number" className="form-control numpad input-sm text-right" value={this.state.jogFeedZ} onChangeValue={(e) => { this.changeJogFeedZ(e) }} />
                                                <span className="input-group-addon"><small>{settings.toolFeedUnits}</small></span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5">
                                            <LiveJogging {... this.state.liveJogging}
                                            onChange={(v) => this.setState({ liveJogging: { ...this.state.liveJogging, active: v } })} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="well well-sm" style={{ marginBottom: 7}} id="macrosBar"><MacrosBar /></div>

            </div>
        )
    }
}

Jog = connect(
    state => ({ settings: state.settings, jogStepsize: state.jogStepsize, gcode: state.gcode.content })
)(Jog);

// Exports
export default Jog


export function runStatus(status) {
    if (status === 'running') {
        playing = true;
        paused = false;
        $('#playicon').removeClass('fa-play');
        $('#playicon').addClass('fa-pause');
    } else if (status === 'paused') {
        paused = true;
        $('#playicon').removeClass('fa-pause');
        $('#playicon').addClass('fa-play');
    } else if (status === 'resumed') {
        paused = false;
        $('#playicon').removeClass('fa-play');
        $('#playicon').addClass('fa-pause');
    } else if (status === 'stopped') {
        playing = false;
        paused = false;
        $('#playicon').removeClass('fa-pause');
        $('#playicon').addClass('fa-play');
    } else if (status === 'finished') {
        playing = false;
        paused = false;
        $('#playicon').removeClass('fa-pause');
        $('#playicon').addClass('fa-play');
    } else if (status === 'alarm') {
        //socket.emit('clearAlarm', 2);
    }
};

export class LiveJogging extends React.Component {

    static isEnabled() {
        return liveJoggingState.active && !liveJoggingState.disabled;
    }

    componentWillReceiveProps(nextProps) {
        liveJoggingState = { active: nextProps.active, hasHomed: nextProps.hasHomed, disabled: nextProps.disabled };
    }

    render() {
        const toggleLiveJogging = (checked) => {
            liveJoggingState.active = checked
            if (this.props.onChange) this.props.onChange(checked);
        }

        return <div className="toggleField">
            <Toggle disabled={!this.props.hasHomed || this.props.disabled} id="toggle_liveJogging" checked={this.props.active} onChange={e => toggleLiveJogging(e.target.checked)} /><label htmlFor="toggle_liveJogging" title="Live jogging allows to travel pressing (ALT or META)+Click in the workspace. Prior homing mandatory. Use carefully."> Live Jogging {this.props.hasHomed ? '': <Label bsStyle="danger" title="Home all first!"><Icon name="home"/>Disabled</Label>}</label>
        </div>

    }
}
