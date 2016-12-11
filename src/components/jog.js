/**
 * Jog module.
 * @module
 */

// React
import React from 'react'

import {MacrosBar} from './macros';

import '../styles/index.css'
import Icon from './font-awesome'
/**
 * Jog component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Jog extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {
        return (
        <div style={{paddingTop: 2}}>
          <div className='panel panel-primary'>
            <div className="panel-heading">
              <h4 className="panel-title"><a className="accordion-toggle" data-toggle="collapse" href="#statusPanel">Status</a></h4>
            </div>
            <div id='statusPanel' className="panel-collapse collapse in" style={{padding: 5}}>
              <span className="badge badge-default badge-notify" title="Items in Queue" id="machineStatus" style={{marginRight: 5, marginTop: 8}}>Not Connected</span>
              <span className="badge badge-default badge-notify" title="Items in Queue" id="queueCnt" style={{marginRight: 5, marginTop: 8}}>Queued: 0</span>
              <div id="mPosition" style={{padding: 5}}>
                  <div id="rX" className="drolabel">X:</div>
                  <div className="btn-group dropdown" style={{marginLeft: -3}}>
                    <button id="" type="button" className="btn btn-sm btn-default" style={{padding: 2, top: -3}} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <span className="fa-stack fa-1x">
                        <i className="fa fa-caret-down fa-stack-1x"></i>
                      </span>
                    </button>
                    <ul className="dropdown-menu">
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b>
                      <br/>NB: Manually jog to ensure other
                      <br/>axes are clear first</li>
                      <li id="XProbeMin"><a href="#"><i className="fa fa-fw fa-arrow-right" aria-hidden="true"></i>Probe X Min</a></li>
                      <li id="XProbeMax"><a href="#"><i className="fa fa-fw fa-arrow-left" aria-hidden="true"></i>Probe X Max</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                      <li id="homeX"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home X Axis</a></li>
                      <li id="zeroX"><a href="#"><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set X Axis Zero</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                      <li id="gotoXZero"><a href="#"><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to X0</a></li>
                    </ul>
                  </div>
                  <div id="mX" className="droPos" style={{marginRight: 0}}>0.00</div><div className="droUnit"> mm</div>
                  <br />

                  <div id="rY" className="drolabel">Y:</div>
                  <div className="btn-group dropdown" style={{marginLeft: -3}}>
                    <button id="" type="button" className="btn btn-sm btn-default" style={{padding: 2, top:-3}} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <span className="fa-stack fa-1x">
                        <i className="fa fa-caret-down fa-stack-1x"></i>
                      </span>
                    </button>
                    <ul className="dropdown-menu">
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b>
                      <br/>NB: Manually jog to ensure other
                      <br/>axes are clear first</li>
                      <li id="YProbeMin"><a href="#"><i className="fa fa-fw fa-arrow-up" aria-hidden="true"></i>Probe Y Min</a></li>
                      <li id="YProbeMax"><a href="#"><i className="fa fa-fw fa-arrow-down" aria-hidden="true"></i>Probe Y Max</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                      <li id="homeY"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home Y Axis</a></li>
                      <li id="zeroY"><a href="#"><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set Y Axis Zero</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                      <li id="gotoYZero"><a href="#"><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to Y0</a></li>
                    </ul>
                  </div>
                  <div id="mY" className="droPos" style={{marginRight: 0}}>0.00</div><div className="droUnit"> mm</div>
                  <br />

                  <div id="rZ" className="drolabel">Z:</div>
                  <div className="btn-group dropdown" style={{marginLeft: -3}}>
                    <button id="" type="button" className="btn btn-sm btn-default" style={{padding: 2, top:-3}} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <span className="fa-stack fa-1x">
                        <i className="fa fa-caret-down fa-stack-1x"></i>
                      </span>
                    </button>
                    <ul className="dropdown-menu">
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-hand-o-down" aria-hidden="true"></i><b>Probe Stock</b>
                      <br/>NB: Manually jog to ensure other
                      <br/>axes are clear first</li>
                      <li id="ZProbeMin"><a href="#" ><i className="fa fa-fw fa-arrow-down" aria-hidden="true"></i>Probe Z Min</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-crop" aria-hidden="true"></i><b>Work Coordinates</b></li>
                      <li id="homeZ"><a href="#"><i className="fa fa-fw fa-home" aria-hidden="true"></i>Home Z Axis</a></li>
                      <li id="zeroZ"><a href="#"><i className="fa fa-fw fa-crosshairs" aria-hidden="true"></i>Set Z Axis Zero</a></li>
                      <li role="separator" className="divider"></li>
                      <li role="presentation" className="dropdown-header"><i className="fa fa-fw fa-arrows" aria-hidden="true"></i><b>Move</b></li>
                      <li id="gotoZZero"><a href="#"><i className="fa fa-fw fa-play" aria-hidden="true"></i>G0 to Z0</a></li>
                    </ul>
                  </div>
                  <div id="mZ" className="droPos" style={{marginRight: 0}}>0.00</div><div className="droUnit"> mm</div>
                  <br />

                  <div id="overrides" className="hide">
                      <div className="drolabel">F:</div><div id="oF" className="droOR" style={{marginRight: 0}}>100<span className="drounitlabel"> %</span></div>
                      <div className="btn-group btn-override">
                          <button id="rF" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Reset F-Override to 100%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-retweet fa-stack-1x"></i>
                              </span>
                          </button>
                          <button id="iF" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Increase by 1% or Ctrl+Click to increase by 10%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-arrow-up fa-stack-1x"></i>
                              </span>
                          </button>
                          <button id="dF" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Decrease by 1% or Ctrl+Click to decrease by 10%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-arrow-down fa-stack-1x"></i>
                              </span>
                          </button>
                      </div><br />
                      <div className="drolabel">S:</div><div id="oS" className="droOR" style={{marginRight: 0}}>100<span className="drounitlabel"> %</span></div>
                      <div className="btn-group btn-override">
                          <button id="rS" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Reset S-Override to 100%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-retweet fa-stack-1x"></i>
                              </span>
                          </button>
                          <button id="iS" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Increase by 1% or Ctrl+Click to increase by 10%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-arrow-up fa-stack-1x"></i>
                              </span>
                          </button>
                          <button id="dS" type="button" className="btn btn-sm btn-default" style={{padding:2, top:-3}} data-toggle="tooltip" data-placement="bottom" title="Click to Decrease by 1% or Ctrl+Click to decrease by 10%">
                              <span className="fa-stack fa-1x">
                                  <i className="fa fa-arrow-down fa-stack-1x"></i>
                              </span>
                          </button>
                      </div>
                    </div>
                </div>
            </div>
          </div>


          <div className='panel panel-primary'>
            <div className="panel-heading">
              <h4 className="panel-title"><a className="accordion-toggle" data-toggle="collapse" href="#controlPanel">Control</a></h4>
            </div>
            <div id='controlPanel' className="panel-collapse collapse in" style={{padding: 5}}>
            <div id="controlmachine" className="btn-group" role="group" aria-label="controljob">
              <div className="btn-group btn-group-justified">
                <div className="btn-group">
                  <button type='button' id="homeAll" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i className="fa fa-home fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">home</strong>
                          <strong className="fa-stack-1x icon-bot-text">laser</strong>
                      </span>
                  </button>
                </div>
                <div className="btn-group">
                  <button type='button' id="playBtn" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i id="playicon" className="fa fa-play fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">run</strong>
                          <strong className="fa-stack-1x icon-bot-text">gcode</strong>
                      </span>
                  </button>
                </div>
                <div className="btn-group"  style={{display: 'none'}}>
                  <button type='button' id="uploadBtn" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i className="fa fa-hdd-o fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">upload</strong>
                          <strong className="fa-stack-1x icon-bot-text">to SD</strong>
                      </span>
                  </button>
                </div>
                <div className="btn-group">
                  <button type='button' id="stopBtn" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i className="fa fa-stop fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">abort</strong>
                          <strong className="fa-stack-1x icon-bot-text">job</strong>
                      </span>
                  </button>
                </div>
                <div className="btn-group">
                  <button type='button' id="zeroAll" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i className="fa fa-crosshairs fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">set</strong>
                          <strong className="fa-stack-1x icon-bot-text">zero</strong>
                      </span>
                  </button>
                </div>
                <div className="btn-group">
                  <button type='button' id="bounding" className="btn btn-ctl btn-default">
                      <span className="fa-stack fa-1x">
                          <i className="fa fa-square-o fa-stack-1x"></i>
                          <strong className="fa-stack-1x icon-top-text">check</strong>
                          <strong className="fa-stack-1x icon-bot-text">outline</strong>
                      </span>
                  </button>
                </div>
              </div>
            </div>
            <p/>
              <table className='centerTable' style={{width: 99 + '%'}}>
                <tbody>
                  <tr>
                    <td>
                      <button id="lT" type="button" data-title="Laser Test" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-fire fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Laser</strong>
                              <strong className="fa-stack-1x icon-bot-text">Test</strong>
                          </span>
                      </button>
                    </td>
                    <td>
                      <button id="yP" type="button" data-title="Jog Y+" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-arrow-up fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Y+</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                    <td>
                      <button id="motorsOff" type="button" data-title="Motors Off" className="btn btn-ctl btn-default" style={{display: 'none'}}>
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-power-off fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Motors</strong>
                              <strong className="fa-stack-1x icon-bot-text">Off</strong>
                          </span>
                      </button>
                    </td>
                    <td></td>
                    <td>
                      <button id="zP" type="button" data-title="Jog X+" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x"><i className="fa fa-arrow-up fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Z+</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <button id="xM" type="button" data-title="Jog X-" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-arrow-left fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">X-</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                    <td>
                      <button id="yM" type="button" data-title="Jog Y-" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-arrow-down fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Y-</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                    <td>
                      <button id="xP" type="button" data-title="Jog X+" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-arrow-right fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">X+</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                    <td>
                      <div style={{width: '8px'}}></div>
                    </td>
                    <td>
                      <button id="zM" type="button" data-title="Jog X+" className="btn btn-ctl btn-default">
                          <span className="fa-stack fa-1x">
                              <i className="fa fa-arrow-down fa-stack-1x"></i>
                              <strong className="fa-stack-1x icon-top-text">Z-</strong>
                              <strong className="fa-stack-1x stepsizeval icon-bot-text">10mm</strong>
                          </span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="5">
                      <div className="input-group">
                        <span className="input-group-addon">X/Y</span>
                        <input id="jogfeedxy" type="text" className="form-control numpad input-sm" defaultValue="30" />
                        <span className="input-group-addon">Z</span>
                        <input id="jogfeedz" type="text" className="form-control numpad  input-sm" defaultValue="5" />
                        <span className="input-group-addon">mm/s</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="5">
                          <form id="stepsize">
                              <div data-toggle="buttons">
                                  <label className="btn btn-jog btn-default">
                                      <input type="radio" name="stp" defaultValue="0.1" />
                                      <span className="fa-stack fa-1x"><i className="fa fa-arrows-h fa-stack-1x"></i>
                                          <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                          <strong className="fa-stack-1x icon-bot-text">0.1mm</strong>
                                      </span>
                                  </label>
                                  <label className="btn btn-jog btn-default">
                                      <input type="radio" name="stp" defaultValue="1" />
                                      <span className="fa-stack fa-1x">
                                          <i className="fa fa-arrows-h fa-stack-1x"></i>
                                          <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                          <strong className="fa-stack-1x icon-bot-text">1mm</strong>
                                      </span>
                                  </label>
                                  <label className="btn btn-jog btn-default">
                                      <input type="radio" name="stp" defaultValue="10" />
                                      <span className="fa-stack fa-1x">
                                          <i className="fa fa-arrows-h fa-stack-1x"></i>
                                          <strong className="fa-stack-1x icon-top-text">jog by</strong>
                                          <strong className="fa-stack-1x icon-bot-text">10mm</strong>
                                      </span>
                                  </label>
                                  <label className="btn btn-jog btn-default">
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
                </tbody>
              </table>
            </div>
          </div>

                <MacrosBar/>
            </div>
        )
    }
}

// Exports
export default Jog
