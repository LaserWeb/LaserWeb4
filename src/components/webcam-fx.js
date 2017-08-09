import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';
import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button } from 'react-bootstrap';
import Toggle from "react-toggle";

import { Info, TooltipFormGroup } from "./forms";

import 'react-toggle/style.css';

function ToggleField({object, field, description, units = "", onChange=undefined, info, disabled=false, ...rest}) {
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;
    let input = <div >
        <Toggle disabled={disabled} id={"toggle_" + object.id + "_" + field} defaultChecked={object[field] == true} onChange={e => onChange(e.target.checked) } />
        <label htmlFor={"toggle_" + object.id + "_" + field}>{description}</label> {info}
    </div>

    return <TooltipFormGroup validationState={errors ? "error" : undefined}
        validationContent={errors}
        validationPlacement="right">{input}</TooltipFormGroup>

}

export class WebcamFxControls extends React.Component {

    constructor(props) {
        super(props)
        this.handleChange.bind(this)
        this.state = Object.assign({},this.props.settings.toolVideoFX)
    }

    handleChange(e, key, prop) {
        let state = { ...this.state };
        if (e) {
            state[key][prop] = e.target.value;
        } else {
            state[key]=prop;
        }
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);

    }

    componentWillReceiveProps(nextProps) {
        this.setState(Object.assign({},nextProps.toolVideoFX))
    }

    render() {

        return <div className="WebcamFxControls">
            <ToggleField  {... { object: this.props.settings.toolVideoFX, field: 'enabled', onChange: (v)=> {this.handleChange(null, 'enabled',v)}, description: <div>Activate Camera feed FX <Label bsStyle="warning">Experimental!</Label></div>, info: Info(<p className="help-block">
                        Enables camera feed transformation/corrections, and embedding on workspace.
                        </p>,"Camera feed FX"), disabled:!this.props.settings['toolVideoDevice'] }} />

            <Collapse in={this.props.settings.toolVideoFX.enabled || false}>
                <div>
                    <table width="100%" className="table table-compact">
                        <tbody>
                            <tr><th colSpan="3">Linear Corrections</th></tr>
                            <tr>
                                <th>Rotation</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.angle)} onChange={(e) => { this.handleChange(e, "inputcorrection", "angle"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.angle)} onChange={(e) => { this.handleChange(e, "inputcorrection", "angle"); }} type="range" min="-3.142" max="3.142" step="any" />    </td>
                            </tr>
                            <tr>
                                <th>Aspect Ratio Correction</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.aspect)} onChange={(e) => { this.handleChange(e, "inputcorrection", "aspect"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.aspect)} onChange={(e) => { this.handleChange(e, "inputcorrection", "aspect"); }} type="range" min="0.5" max="2" step="any" />    </td>
                            </tr>                    
                            <tr>
                                <th>Zoom</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.scale)} onChange={(e) => { this.handleChange(e, "inputcorrection", "scale"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.inputcorrection.scale)} onChange={(e) => { this.handleChange(e, "inputcorrection", "scale"); }} type="range" min="0.1" max="2" step="any" />    </td>
                            </tr>
                            <tr><th colSpan="3">Lens Correction</th></tr>
                            <tr>
                                <th>Inverse Focal Length</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.lens.invF)} onChange={(e) => { this.handleChange(e, "lens", "invF"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.lens.invF)} onChange={(e) => { this.handleChange(e, "lens", "invF"); }} type="range" min="0.01" max="1" step="any" />    </td>
                            </tr>                    
                            <tr><th colSpan="3">Corner Marker Placement</th></tr>
                            <tr>
                                <th>Front Left</th>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[0])} onChange={(e) => { this.handleChange(e, "refcoords", "0"); }} /></td>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[1])} onChange={(e) => { this.handleChange(e, "refcoords", "1"); }} /></td>
                            </tr>
                            <tr>
                                <th>Back Left</th>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[2])} onChange={(e) => { this.handleChange(e, "refcoords", "2"); }} /></td>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[3])} onChange={(e) => { this.handleChange(e, "refcoords", "3"); }} /></td>
                            </tr>
                            <tr>
                                <th>Back Right</th>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[4])} onChange={(e) => { this.handleChange(e, "refcoords", "4"); }} /></td>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[5])} onChange={(e) => { this.handleChange(e, "refcoords", "5"); }} /></td>
                            </tr>
                            <tr>
                                <th>Front Right</th>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[6])} onChange={(e) => { this.handleChange(e, "refcoords", "6"); }} /></td>
                                <td><input type="number" step="0.1" value={parseFloat(this.props.settings.toolVideoFX.refcoords[7])} onChange={(e) => { this.handleChange(e, "refcoords", "7"); }} /></td>
                            </tr>
                            <tr><th colSpan="3">Perspective Coorection</th></tr>
                            <tr>
                                <th>Near Perspective</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.lens.r1)} onChange={(e) => { this.handleChange(e, "lens", "r1"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.lens.r1)} onChange={(e) => { this.handleChange(e, "lens", "r1"); }} type="range" min="0.01" max="3" step="any" />    </td>
                            </tr>
                            <tr>
                                <th>Far Perspective</th>
                                <td><input type="number" step="0.01" value={parseFloat(this.props.settings.toolVideoFX.lens.r2)} onChange={(e) => { this.handleChange(e, "lens", "r2"); }} /></td>
                                <td width="100%"><input className="form-control" value={parseFloat(this.props.settings.toolVideoFX.lens.r2)} onChange={(e) => { this.handleChange(e, "lens", "r2"); }} type="range" min="0.01" max="3" step="any" />    </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Collapse>
        </div>
    }

}


WebcamFxControls = connect(
    (state)=>({settings:state.settings})
)(WebcamFxControls);

export class PerpectiveControls extends React.Component {
    render(){
        return <div className="perspectiveControls">aaa</div>
    }
}


export class Coordinator extends React.Component {

    constructor(props) {
        super(props);
        this.state = { position: this.props.position.map(parseFloat) || [0, 0, 0, 0, 0, 0, 0, 0] }
        this.handleDrag.bind(this)
        this.handleStop.bind(this)
    }

    handleDrag(e, ui, index) {
        let position = Object.assign({}, this.state.position);
        position[index * 2] = position[index * 2] + ui.deltaX;
        position[index * 2 + 1] = position[index * 2 + 1] + ui.deltaY;
        this.setState({ position: position });

        if (this.props.onChange)
            this.props.onChange(position)
    }

    handleStop(e, ui, index) {
        if (this.props.onStop)
            this.props.onStop(this.state.position)
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ position: nextProps.position.map(parseFloat) })
    }

    render() {

        let dots = this.props.dots || ['red', 'green', 'blue', 'purple']
        let dotSize = this.props.dotSize || 10;
        let symbol = this.props.symbol || ((props) => { return <svg height="100%" width="100%" style={{ position: "absolute", left: 0, top: 0 }}><circle r="50%" cx="50%" cy="50%" fill={props.fill} stroke="white" strokeWidth="1" /></svg> })

        return <div className="coordinator" style={{ width: this.props.width + "px", height: this.props.height + "px", position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
            {dots.map((fill, i) => {
                return <Draggable onStop={(e, ui) => { this.handleStop(e, ui, i) }} onDrag={(e, ui) => this.handleDrag(e, ui, i)} key={i} position={{ x: this.state.position[i * 2], y: this.state.position[i * 2 + 1] }} bounds="parent">
                    <div className="symbol" style={{ position: "absolute", left: 0, top: 0, cursor: "move", marginTop: -dotSize / 2, marginLeft: -dotSize / 2, width: dotSize, height: dotSize }}>{symbol({ fill })}</div>
                </Draggable>
            })}
        </div >
    }
}

Coordinator = connect()(Coordinator);