// Copyright 2016 Todd Fleming
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

import React from 'react'
import { connect } from 'react-redux';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';

import { removeOperation, moveOperation, setCurrentOperation, operationRemoveDocument, setOperationAttrs, clearOperations, spreadOperationField, operationLatheTurnAdd, operationLatheTurnRemove, operationLatheTurnSetAttrs } from '../actions/operation';
import { selectDocument } from '../actions/document'
import { addOperation } from '../actions/operation'
import { hasClosedRawPaths } from '../lib/mesh';
import { Input, InputRangeField } from './forms.js';
import { GetBounds, withGetBounds, withStoredBounds } from './get-bounds.js';
import { selectedDocuments } from './document'

import Toggle from 'react-toggle';
import { isObject, getDescendantProp } from '../lib/helpers';

import { MaterialPickerButton, MaterialSaveButton } from './material-database'

import { ButtonToolbar, Button, ButtonGroup } from 'react-bootstrap';
import Icon from './font-awesome'

import { Details } from './material-database'

import { confirm } from './laserweb'

import { SETTINGS_INITIALSTATE } from '../reducers/settings'

import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import "../styles/context-menu.css";

function StringInput(props) {
    let { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest } = props;
    let value = op[field.name];
    return <Input value={value !== undefined ? value : ''}  {...rest } />;
}

function NumberInput(props) {
    let { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest } = props;
    return <Input type='number' step='any' value={op[field.name]}   {...rest } />;
}

function EnumInput(opts, def) {
    if (Array.isArray(opts))
        opts = Object.assign(...opts.map(i => ({ [i]: i })))

    return function ({ op, field, onChangeValue, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest }) {
        return <select value={op[field.name]}  {...rest} >
            {Object.entries(opts).map((e, i) => (<option key={i} value={e[0]}>{e[1]}</option>))}
        </select>
    }
}

const DirectionInput = EnumInput(['Conventional', 'Climb']);
const GrayscaleInput = EnumInput(['none', 'average', 'luma', 'luma-601', 'luma-709', 'luma-240', 'desaturation', 'decomposition-min', 'decomposition-max', 'red-chanel', 'green-chanel', 'blue-chanel']);

function CheckboxInput({ op, field, onChangeValue, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest }) {
    return <input {...rest} checked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} type="checkbox" />
}

function ToggleInput({ op, field, onChangeValue, operationsBounds, fillColors, strokeColors, settings, className = "scale75", dispatch, ...rest }) {
    return <Toggle id={"toggle_" + op.id + "_" + field} defaultChecked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} className={className} />
}

function RangeInput(minValue, maxValue) {
    return ({ op, field, onChangeValue, dispatch, ...rest }) => {
        return <InputRangeField maxValue={maxValue} minValue={minValue} value={op[field.name]} onChangeValue={value => onChangeValue(value)} />
    }
}

function TagInput(statekey, opts = { multi: true, simpleValue: true, delimiter: ',', clearable: true }, connector) {
    if (!connector) connector = (state) => { return { options: Object.entries(getDescendantProp(state, statekey)).map(i => { return { label: i[1].label, value: i[0] } }) } }
    return connect(connector)(class extends React.Component {
        render() {
            return <Select options={this.props.options} value={this.props.op[this.props.field.name]} onChange={e => this.props.onChangeValue(e)} {...{ ...opts }} />
        }
    });

}

function ButtonInput(args) {
    return <Button onClick={e => args.field.onClick(e, args)} bsSize="xsmall" bsStyle="info" >{args.field.buttonLabel}</Button>;
}

function TableInput({ op, field, operationsBounds, fillColors, strokeColors, settings, dispatch }) {
    let { name, fields, remove } = field;
    let array = op[name];
    if (!array.length)
        return null;
    return <div style={{ display: 'inline-block' }}><table><tbody>
        <tr>{Object.entries(fields).map(f => <th key={f[1].name} style={{ paddingRight: 10 }}>{f[1].label}</th>)}</tr>
        {array.map((item, index) => <tr key={item.id}>
            {Object.entries(fields).map(f => <td key={f[1].name}>
                <Field {...{
                    op: item, field: f[1], operationsBounds, fillColors, strokeColors, settings,
                    setAttrs: operationLatheTurnSetAttrs, dispatch, justControl: true, parent: op, index,
                }} />
            </td>)}
            <td>
                <button className="btn btn-default btn-xs" onClick={e => dispatch(remove(item.id))}>
                    <i className="fa fa-trash"></i>
                </button>
            </td>
        </tr>)}
    </tbody></table></div>;
}

function ColorBox(v) {
    let rgb = 'rgb(' + v.color[0] * 255 + ',' + v.color[1] * 255 + ',' + v.color[2] * 255 + ')';
    return (
        <span style={{ backgroundColor: rgb, width: 40, display: 'inline-block' }}>&nbsp;</span>
    );
}

class FilterInput extends React.Component {
    UNSAFE_componentWillMount() {
        this.onChange = this.onChange.bind(this);
    }

    onChange(v) {
        if (v)
            this.props.onChangeValue(JSON.parse(v.value));
        else
            this.props.onChangeValue(null);
    }

    render() {
        let { op, field, onChange, onChangeValue, operationsBounds, fillColors, strokeColors, settings, ...rest } = this.props;
        let raw = op[field.name];
        let colors = field.name === 'filterFillColor' ? fillColors : strokeColors;
        let value;
        if (raw)
            value = JSON.stringify(raw);
        else
            value = null;
        return (
            <Select
                value={value} options={colors} onChange={this.onChange} searchable={false}
                optionRenderer={ColorBox} valueRenderer={ColorBox} {...rest} />
        );
    }
}

export function Error(props) {
    let { bounds, operationsBounds, message } = props;
    return (
        <div className="error-bubble-clip" style={{ left: operationsBounds.right, top: operationsBounds.top }}>
            <div style={{ height: operationsBounds.bottom - operationsBounds.top }}>
                <div className='error-bubble' style={{ top: (bounds.top + bounds.bottom) / 2 - operationsBounds.top }}>
                    <div className='error-bubble-arrow' />
                    <div className='error-bubble-message'>{message}</div>
                </div>
            </div>
        </div>
    );
}
Error = withStoredBounds(Error);

function NoOperationsError(props) {
    let { documents, operations, operationsBounds } = props;
    if (documents.length && !operations.length)
        return <GetBounds Type="span"><Error operationsBounds={operationsBounds} message='Drag Documents(s) Here' /></GetBounds>;
    else
        return <span />;
}

class Field extends React.Component {
    UNSAFE_componentWillMount() {
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    onChangeValue(v) {
        let { op, field, setAttrs } = this.props;
        if (op[field.name] !== v)
            this.props.dispatch(setAttrs({ [field.name]: v }, op.id));
    }

    onChange(e) {
        this.onChangeValue(e.target.value);
    }

    onFocus(e) {
        if (!this.props.selected)
            this.props.dispatch(setCurrentOperation(this.props.op.id));
    }

    render() {
        let { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, justControl, parent, index } = this.props;
        let Input = field.input;
        let { units, wide, style } = field;
        let error;
        if (units === 'mm/min' && settings.toolFeedUnits === 'mm/s')
            units = settings.toolFeedUnits;
        if (field.check && !field.check(op[field.name], settings, op, parent, index))
            error = <Error operationsBounds={operationsBounds} message={(typeof field.error == 'function') ? field.error(op[field.name], settings, op, parent, index) : field.error} />;

        let Ctx = field.contextMenu;
        let label = (Ctx) ? (<Ctx {...{ dispatch, op, field, settings }}><span style={{ borderBottom: "1px dotted darkgray", cursor: "copy" }}>{field.label}</span></Ctx>) : field.label;

        if (justControl) {
            return (
                <GetBounds Type="div">
                    <Input
                        {...{ op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, style }}
                        onChange={this.onChange} onChangeValue={this.onChangeValue} onFocus={this.onFocus} />
                    {error}
                </GetBounds>
            );
        }

        if (wide) {
            return (
                <GetBounds Type="tr">
                    <td colSpan="3">
                        <Input
                            {...{ op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, style }}
                            onChange={this.onChange} onChangeValue={this.onChangeValue} onFocus={this.onFocus} />
                    </td>
                    <td>{units}{error}</td>
                </GetBounds>
            );
        }

        return (
            <GetBounds Type="tr">
                <th width="50%">{label}</th>
                <td>
                    <Input
                        {...{ op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, style }}
                        onChange={this.onChange} onChangeValue={this.onChangeValue} onFocus={this.onFocus} />
                </td>
                <td>{units}{error}</td>
            </GetBounds>
        );
    }
};

class Doc extends React.Component {
    UNSAFE_componentWillMount() {
        this.remove = e => {
            this.props.dispatch(operationRemoveDocument(this.props.op.id, this.props.isTab, this.props.id));
        }
    }

    render() {
        let { op, documents, id } = this.props;
        return (
            <tr>
                <td style={{ width: '100%', whiteSpace: 'nowrap' }}>
                    └ <a style={{ userSelect: 'none', cursor: 'pointer', textDecoration: 'bold', color: '#FFF', paddingLeft: 5, paddingRight: 5, paddingBottom: 3, backgroundColor: '#337AB7', border: '1px solid', borderColor: '#2e6da4', borderRadius: 2 }} onClick={(e) => { this.props.dispatch(selectDocument(id)) }}>{documents.find(d => d.id === id).name}</a>
                </td>
                <td>
                    <button className="btn btn-default btn-xs" onClick={this.remove}>
                        <i className="fa fa-trash"></i>
                    </button>
                </td>
                <td style={{ paddingLeft: 15 }} ></td>
            </tr>
        );
    }
}
Doc = connect()(Doc);

const checkPositive = {
    check: v => v > 0,
    error: 'Must be > 0',
};

const checkPositiveInt = {
    check: v => v > 0 && (v | 0) === +v,
    error: 'Must be integer > 0',
};

const checkGE0 = {
    check: v => v >= 0,
    error: 'Must be >= 0',
};

const checkGE0Int = {
    check: v => v >= 0 && (v | 0) === +v,
    error: 'Must be integer >= 0',
};

const checkNot0 = {
    check: v => +v != 0,
    error: 'Must be non-0',
};

const checkPercent = {
    check: v => v >= 0 && v <= 100,
    error: 'Must be in range [0, 100]',
};

const checkStepOver = {
    check: v => v > 0 && v <= 100,
    error: 'Must be > 0 and <= 100',
};

const checkToolAngle = {
    check: v => v > 0 && v < 180,
    error: 'Must be in range (0, 180)',
};

const checkToolDiameter = {
    check: (v, settings, op) => v > 0 || op.type === 'Mill Cut' && v >= 0,
    error: (v, settings, op) => op.type === 'Mill Cut' ? 'Must be >= 0' : 'Must be > 0',
};

function checkRange(min, max) {
    return {
        check: (v) => {
            if (isFinite(v)) {
                return v >= min && v <= max;
            } else if (isObject(v) && v.hasOwnProperty('min') && v.hasOwnProperty('max')) {
                return (v.min >= min && v.min <= max) && (v.max >= min && v.max <= max)
            }
        },
        error: 'Must be in range [' + min + ' , ' + max + ']',
    }
}

function checkFeedRateRange(axis) {
    return {
        check: (v, settings) => {

            let { min, max } = Object.assign(SETTINGS_INITIALSTATE.machineFeedRange, settings.machineFeedRange)[axis];
            if (isFinite(v)) {
                return v >= min && v <= max;
            } else if (isObject(v) && v.hasOwnProperty('min') && v.hasOwnProperty('max')) {
                return (v.min >= min && v.min <= max) && (v.max >= min && v.max <= max)
            }
        },
        error: (v, settings) => {
            let { min, max } = Object.assign(SETTINGS_INITIALSTATE.machineFeedRange, settings.machineFeedRange)[axis];
            if (isNaN(min) || isNaN(max))
                return 'Check settings/machine first!';
            return 'Must be in range [' + min + ' , ' + max + ']'
        }
    }
}

const ifUseA = {
    condition: op => op.useA
};

const checkZHeight = {
    check: (v, settings) => settings.machineZEnabled && !isNaN(v),
    error: (v, settings, op) => {
        if (!op.type.match(/^Laser/)) return false;
        if (!settings.machineZEnabled) return 'Laser Z Stage must be enabled';
        return 'Has to be a number';
    }
}

const ifUseZ = {
    condition: (op, settings) => {
        if (!op.type.match(/^Laser/)) return true;
        return settings.machineZEnabled
    }
};

const ifUseBlower = {
    condition: (op, settings) => {
        if (!op.type.match(/^Laser/)) return false;
        return settings.machineBlowerEnabled
    }
};

const ifUseFluid = {
    condition: (op, settings) => {
        if (!op.type.match(/^Mill/) && !op.type.match(/^Lathe/)) return false;
        return settings.machineFluidEnabled
    }
};

const checkPassDepth = {
    check: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.check(v, settings, op) : checkPositive.check(v, settings, op) },
    error: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.error : checkPositive.error },
}

const checkMillStartZ = {
    check: (v, settings, op) => v <= op.millRapidZ,
    error: 'Must be <= Rapid Z',
};

const checkMillEndZ = {
    check: (v, settings, op) => v < op.millStartZ,
    error: 'Must be < Start Z',
};

const checkLatheStartZ = {
    check: (v, settings, op) => v <= op.latheRapidToZ - op.latheFinishDepth,
    error: 'Must be <= Rapid To Z - Finish Depth',
};

const checkLatheFaceEndDiameter = {
    condition: op => op.latheFace,
    check: (v, settings, op) => {
        if (op.latheFaceEndDiameter >= op.latheRapidToDiameter)
            return false;
        if (op.latheFaceEndDiameter < -op.latheRapidToDiameter)
            return false;
        return true;
    },
    error: (v, settings, op) => {
        if (op.latheFaceEndDiameter >= op.latheRapidToDiameter)
            return "Must be < Rapid To Diameter";
        if (op.latheFaceEndDiameter < -op.latheRapidToDiameter)
            return "Must be >= -(Rapid To Diameter)";
        return "I'm confused";
    },
};

const latheTurnAdd = {
    check: (v, settings, op) => op.latheFace || op.latheTurns.length > 0,
    error: 'Need at least one turn when not facing',
    onClick: (e, { op, dispatch }) => dispatch(operationLatheTurnAdd(op.id)),
};

const checkLatheTurn = {
    check: (v, settings, turn, parent, index) => {
        if (turn.startDiameter < 0)
            return false;
        if (index > 0 && turn.startDiameter < parent.latheTurns[index - 1].endDiameter)
            return false;
        if (turn.startDiameter >= parent.latheRapidToDiameter)
            return false;
        if (turn.endDiameter <= 0)
            return false;
        if (turn.endDiameter < turn.startDiameter)
            return false;
        if (turn.endDiameter >= parent.latheRapidToDiameter - parent.latheFinishDepth)
            return false;
        if (turn.endDiameter !== turn.startDiameter)
            return false;
        if (turn.length <= 0)
            return false;
        return true;
    },
    error: (v, settings, turn, parent, index) => {
        if (turn.startDiameter < 0)
            return 'Start Diameter must be >= 0';
        if (index > 0 && turn.startDiameter < parent.latheTurns[index - 1].endDiameter)
            return 'Start Diameter must be >= previous End Diameter';
        if (turn.startDiameter >= parent.latheRapidToDiameter)
            return 'Start Diameter must be < Rapid';
        if (turn.endDiameter <= 0)
            return 'End Diameter must be > 0';
        if (turn.endDiameter < turn.startDiameter)
            return 'End Diameter must be >= Start Diameter';
        if (turn.endDiameter >= parent.latheRapidToDiameter - parent.latheFinishDepth)
            return 'End Diameter must be < Rapid - Finish Depth';
        if (turn.endDiameter !== turn.startDiameter)
            return 'Taper not implemented yet';
        if (turn.length <= 0)
            return 'Length must be > 0';
        return "I'm confused";
    },
};

const FieldContextMenu = (id = uuidv4()) => {
    return ({ children, dispatch, op, field, settings }) => {
        let ctx = <ContextMenu id={id}>
            <MenuItem onClick={e => dispatch(spreadOperationField(op.id, field.name))}>Copy to all Ops</MenuItem>
        </ContextMenu>
        return <div title="Right click or long press for options"><ContextMenuTrigger id={id} holdToDisplay={1000}>{children}</ContextMenuTrigger>{ctx}</div>
    }
}

export const OPERATION_LATHE_TURN_FIELDS = {
    startDiameter: { name: 'startDiameter', label: 'Start Diameter', input: NumberInput, style: { width: 80 }, ...checkLatheTurn, contextMenu: FieldContextMenu() },
    endDiameter: { name: 'endDiameter', label: 'End Diameter', input: NumberInput, style: { width: 80 }, contextMenu: FieldContextMenu() },
    length: { name: 'length', label: 'Length', input: NumberInput, style: { width: 80 }, contextMenu: FieldContextMenu() },
};

export const OPERATION_FIELDS = {
    name: { name: 'name', label: 'Name', units: '', input: StringInput },

    filterFillColor: { name: 'filterFillColor', label: 'Filter Fill', units: '', input: FilterInput },
    filterStrokeColor: { name: 'filterStrokeColor', label: 'Filter Stroke', units: '', input: FilterInput },
    direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput, contextMenu: FieldContextMenu() },

    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput, ...checkPercent, contextMenu: FieldContextMenu() },
    laserPowerMin: { name: 'laserPowerMin', label: 'Laser Power Min', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
    laserPowerMax: { name: 'laserPowerMax', label: 'Laser Power Max', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
    laserPowerCutoff: { name: 'laserPowerCutoff', label: 'Laser Power Cutoff', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput, ...checkPositive, contextMenu: FieldContextMenu() },
    lineDistance: { name: 'lineDistance', label: 'Line Distance', units: 'mm', input: NumberInput, ...checkPositive, contextMenu: FieldContextMenu() },
    lineAngle: { name: 'lineAngle', label: 'Line Angle', units: 'deg', input: NumberInput, contextMenu: FieldContextMenu() },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput, ...checkToolDiameter, contextMenu: FieldContextMenu() },
    toolAngle: { name: 'toolAngle', label: 'Tool Angle', units: 'deg', input: NumberInput, ...checkToolAngle, contextMenu: FieldContextMenu() },

    margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
    passes: { name: 'passes', label: 'Passes', units: '', input: NumberInput, ...checkPositiveInt, contextMenu: FieldContextMenu() },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '%', input: NumberInput, ...checkStepOver, contextMenu: FieldContextMenu() },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput, ...checkPassDepth, ...ifUseZ, contextMenu: FieldContextMenu() },
    millRapidZ: { name: 'millRapidZ', label: 'Rapid Z', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
    millStartZ: { name: 'millStartZ', label: 'Start Z', units: 'mm', input: NumberInput, ...checkMillStartZ, contextMenu: FieldContextMenu() },
    millEndZ: { name: 'millEndZ', label: 'End Z', units: 'mm', input: NumberInput, ...checkMillEndZ, contextMenu: FieldContextMenu() },
    startHeight: { name: 'startHeight', label: 'Start Height', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu(), ...checkZHeight, ...ifUseZ },
    segmentLength: { name: 'segmentLength', label: 'Segment', units: 'mm', input: NumberInput, ...checkGE0, contextMenu: FieldContextMenu() },
    ramp: { name: 'ramp', label: 'Ramp Plunge', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },

    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('Z'), contextMenu: FieldContextMenu() },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY'), contextMenu: FieldContextMenu() },
    toolSpeed: { name: 'toolSpeed', label: 'Tool Speed (0=Off)', units: 'rpm', input: NumberInput, ...checkFeedRateRange('S'), contextMenu: FieldContextMenu() },

    useA: { name: 'useA', label: 'Use A Axis', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },
    aAxisDiameter: { name: 'aAxisDiameter', label: 'A Diameter', units: 'mm', input: NumberInput, ...checkPositive, ...ifUseA, contextMenu: FieldContextMenu() },

    useBlower: { name: 'useBlower', label: 'Use Air Assist', units: '', input: ToggleInput, ...ifUseBlower, contextMenu: FieldContextMenu() },
    useFluid: { name: 'useFluid', label: 'Use Fluid Assist', units: '', input: ToggleInput, ...ifUseFluid, contextMenu: FieldContextMenu() },

    smoothing: { name: 'smoothing', label: 'Smoothing', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: Smoothing the input image ?
    brightness: { name: 'brightness', label: 'Brightness', units: '', input: NumberInput, ...checkRange(-255, 255) },   // lw.raster-to-gcode: Image brightness [-255 to +255]
    contrast: { name: 'contrast', label: 'Contrast', units: '', input: NumberInput, ...checkRange(-255, 255) },         // lw.raster-to-gcode: Image contrast [-255 to +255]
    gamma: { name: 'gamma', label: 'Gamma', units: '', input: NumberInput, ...checkRange(0, 7.99) },                    // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
    grayscale: { name: 'grayscale', label: 'Grayscale', units: '', input: GrayscaleInput },                             // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
    shadesOfGray: { name: 'shadesOfGray', label: 'Shades', units: '', input: NumberInput, ...checkRange(2, 256) },      // lw.raster-to-gcode: Number of shades of gray [2-256]
    invertColor: { name: 'invertColor', label: 'Invert Color', units: '', input: ToggleInput },                         // lw.raster-to-gcode
    trimLine: { name: 'trimLine', label: 'Trim Pixels', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },                                // lw.raster-to-gcode: Trim trailing white pixels
    joinPixel: { name: 'joinPixel', label: 'Join Pixels', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: Join consecutive pixels with same intensity
    burnWhite: { name: 'burnWhite', label: 'Burn White', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },   // lw.raster-to-gcode: [true = G1 S0 | false = G0] on inner white pixels
    verboseGcode: { name: 'verboseGcode', label: 'Verbose GCode', units: '', input: ToggleInput },                      // lw.raster-to-gcode: Output verbose GCode (print each commands)
    vertical: { name: 'vertical', label: 'Vertical', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },       // lw.raster-to-gcode: Go Vertically or reverse diagonally
    diagonal: { name: 'diagonal', label: 'Diagonal', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },       // lw.raster-to-gcode: Go diagonally (increase the distance between points)
    dithering: { name: 'dithering', label: 'Dithering', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },     // lw.raster-to-gcode: dither image
    overScan: { name: 'overScan', label: 'Over Scan', units: 'mm', input: NumberInput, ...checkGE0, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: This feature add some extra white space before and after each line. This leaves time to reach the feed rate before starting to engrave and can prevent over burning the edges of the raster.

    latheToolBackSide: { name: 'latheToolBackSide', label: 'Tool Back Side', input: ToggleInput },
    latheRapidToDiameter: { name: 'latheRapidToDiameter', label: 'Rapid To Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    latheRapidToZ: { name: 'latheRapidToZ', label: 'Rapid To Z', units: 'mm', input: NumberInput },
    latheStartZ: { name: 'latheStartZ', label: 'Start Z', units: 'mm', input: NumberInput, ...checkLatheStartZ },
    latheRoughingFeed: { name: 'latheRoughingFeed', label: 'Roughing Feed', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY') },
    latheRoughingDepth: { name: 'latheRoughingDepth', label: 'Roughing Depth', units: 'mm', input: NumberInput, ...checkPositive },
    latheFinishFeed: { name: 'latheFinishFeed', label: 'Finish Feed', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY') },
    latheFinishDepth: { name: 'latheFinishDepth', label: 'Finish Depth', units: 'mm', input: NumberInput, ...checkGE0 },
    latheFinishExtraPasses: { name: 'latheFinishExtraPasses', label: 'Finish Extra Passes', input: NumberInput, ...checkGE0Int },
    latheFace: { name: 'latheFace', label: 'Face', input: ToggleInput },
    latheFaceEndDiameter: { name: 'latheFaceEndDiameter', label: 'Face End Diameter', units: 'mm', input: NumberInput, ...checkLatheFaceEndDiameter },
    latheTurnAdd: { name: 'latheTurnAdd', buttonLabel: 'Add Turn', input: ButtonInput, wide: true, ...latheTurnAdd },
    latheTurns: { name: 'latheTurns', input: TableInput, fields: OPERATION_LATHE_TURN_FIELDS, remove: operationLatheTurnRemove, wide: true },

    hookOperationStart: { name: 'hookOperationStart', label: 'Pre Op', units: '', input: TagInput('settings.macros') },
    hookOperationEnd: { name: 'hookOperationEnd', label: 'Post Op', units: '', input: TagInput('settings.macros') },
    hookPassStart: { name: 'hookPassStart', label: 'Pre Pass', units: '', input: TagInput('settings.macros') },
    hookPassEnd: { name: 'hookPassEnd', label: 'Post Pass', units: '', input: TagInput('settings.macros') },
};

export const OPERATION_GROUPS = {
    'Filters': {
        collapsible: false,
        fields: ['smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering']
    },
    'Macros': {
        collapsible: true,
        fields: ['hookOperationStart', 'hookOperationEnd', 'hookPassStart', 'hookPassEnd']
    }
}

const tabFields = [
    { name: 'tabDepth', label: 'Tab Depth', units: 'mm', input: NumberInput, ...checkGE0 },
];

export const OPERATION_TYPES = {
    'Laser Cut': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserPower', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Cut Inside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Cut Outside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Fill Path': { allowTabs: false, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Raster': {
        allowTabs: false, tabFields: false, fields: [
            'name', 'laserPowerMin', 'laserPowerMax', 'laserPowerCutoff', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower',
            'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'vertical', 'diagonal', 'overScan', 'useA', 'aAxisDiameter',
            ...OPERATION_GROUPS.Filters.fields, ...OPERATION_GROUPS.Macros.fields
        ]
    },
    'Laser Raster Merge': {
        allowTabs: false, tabFields: false, fields: [
            'name', 'filterFillColor', 'filterStrokeColor',
            'laserPowerMin', 'laserPowerMax', 'laserPowerCutoff', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower',
            'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'vertical', 'diagonal', 'overScan', 'useA', 'aAxisDiameter',
            ...OPERATION_GROUPS.Filters.fields, ...OPERATION_GROUPS.Macros.fields
        ]
    },
    'Mill Pocket': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut Inside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'useFluid', 'segmentLength', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut Outside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'useFluid', 'segmentLength', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill V Carve': { allowTabs: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'hookOperationStart', 'hookOperationEnd'] },
    'Lathe Conv Face/Turn': { skipDocs: true, tabFields: false, fields: ['name', 'latheToolBackSide', 'latheRapidToDiameter', 'latheRapidToZ', 'latheStartZ', 'latheRoughingFeed', 'latheRoughingDepth', 'latheFinishFeed', 'latheFinishDepth', 'useFluid', 'latheFinishExtraPasses', 'latheFace', 'latheFaceEndDiameter', 'latheTurnAdd', 'latheTurns', 'hookOperationStart', 'hookOperationEnd'] },
};

const groupFields = (ofields) => {
    let groups = { '_default': { visible: true, collapsible: false, fields: [] } };
    let fields = ofields.slice();

    Object.entries(OPERATION_GROUPS).forEach(entry => {
        let [key, group] = entry;
        if (!groups.hasOwnProperty(key)) {
            groups[key] = Object.assign({}, group)
            groups[key].fields = []
        }
        group.fields.forEach(field => {
            let index = fields.indexOf(field);
            if (index > -1)
                groups[key].fields.push(fields.splice(index, 1).pop())

        })
    })

    groups['_default'].fields = fields

    return groups;
}

const traverseDocumentTypes = (ids, documents) => {
    let result = { images: 0, vectors: 0, other: 0 };
    ids.forEach((id) => {
        let item = documents.find((item) => item.id == id)
        if (item) {
            if (item.dataURL) {
                result.images++
            } else if (item.rawPaths) {
                result.vectors++
            } else {
                result.other++
            }

            if (item.children.length) {
                let { images, vectors, other } = traverseDocumentTypes(item.children, documents)
                result.images += images;
                result.vectors += vectors;
                result.other += other;
            }
        }
    })
    return result;
}

class Operation extends React.Component {

    UNSAFE_componentWillMount() {
        this.setType = e => this.props.dispatch(setOperationAttrs({ type: e.target.value }, this.props.op.id));
        this.setTypeString = e => this.props.dispatch(setOperationAttrs({ type: e }, this.props.op.id));
        this.toggleExpanded = e => this.props.dispatch(setOperationAttrs({ expanded: !this.props.op.expanded }, this.props.op.id));
        this.toggleEnabled = e => this.props.dispatch(setOperationAttrs({ enabled: !this.props.op.enabled }, this.props.op.id));
        this.remove = e => this.props.dispatch(removeOperation(this.props.op.id));
        this.moveUp = e => this.props.dispatch(moveOperation(this.props.op.id, -1));
        this.moveDn = e => this.props.dispatch(moveOperation(this.props.op.id, +1));
        this.preset = (type, attrs) => this.props.dispatch(setOperationAttrs({ ...attrs,type: type }, this.props.op.id))
        this.toggleDocs = e => this.props.dispatch(setOperationAttrs({ _docs_visible: !this.props.op._docs_visible }, this.props.op.id));

        this.documentsCount = null;
        this.documentTypes = { vectors: 0, images: 0 };
        this.availableOps = Object.keys(OPERATION_TYPES);
        this.operationGroups = groupFields(OPERATION_TYPES[this.props.op.type].fields)
    }

    UNSAFE_componentWillReceiveProps(nextProps) {

        if (nextProps.op.documents.length !== this.documentsCount) {
            this.documentsCount = nextProps.op.documents.length
            this.documentTypes = traverseDocumentTypes(nextProps.op.documents, nextProps.documents)
            this.availableOps = Object.keys(OPERATION_TYPES);
            if (nextProps.op.documents.length) {
                if (!this.documentTypes.vectors) this.availableOps = this.availableOps.filter(item => item.match(/Raster/gi))
                if (!this.documentTypes.images) this.availableOps = this.availableOps.filter(item => !item.match(/^Laser Raster$/gi))

                if (!this.availableOps.includes(nextProps.op.type))
                    this.setTypeString(this.availableOps[0])
            }
        }

        if (nextProps.op.type != this.props.op.type) {
            this.operationGroups = groupFields(OPERATION_TYPES[nextProps.op.type].fields)
        }
    }

    render() {
        let { op, documents, selected, bounds, dispatch, fillColors, strokeColors, settings } = this.props;
        let error;
        if (!op.expanded) {
            for (let fieldName of OPERATION_TYPES[op.type].fields) {
                let field = OPERATION_FIELDS[fieldName];
                if (field.check && !field.check(op[fieldName], settings, op) && (!field.condition || field.condition(op, settings))) {
                    error = <Error operationsBounds={bounds} message="Expand to setup operation" />;
                    break;
                }
            }
        }

        let leftStyle;
        if (selected)
            leftStyle = { display: 'table-cell', borderLeft: '4px solid blue', borderRight: '4px solid transparent' };
        else
            leftStyle = { display: 'table-cell', borderLeft: '4px solid transparent', borderRight: '4px solid transparent' };

        let header;

        if (op.name && op.name.length)
            header = (<h5 style={{ marginTop: 0 }} onClick={this.toggleExpanded}>{op.name}</h5>)

        let rows = [
            <GetBounds Type="div" key="header" style={{ display: 'table-row' }} data-operation-id={op.id}>
                <div style={leftStyle} />
                <div style={{ display: 'table-cell', cursor: 'pointer' }}>
                    <i onClick={this.toggleExpanded}
                        className={op.expanded ? 'fa fa-fw fa-minus-circle' : 'fa fa-fw fa-plus-circle'} />
                </div>

                <div style={{ display: 'table-cell', width: '100%' }}>
                    {header}
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>

                        <div style={{ whiteSpace: 'nowrap' }}>
                            <select className="input-xs" value={op.type} onChange={this.setType}>{Object.keys(OPERATION_TYPES).map(type => <option key={type} disabled={!this.availableOps.includes(type)}>{type}</option>)}</select>
                            <MaterialPickerButton className="btn btn-success btn-xs" onApplyPreset={this.preset} operation={op} types={this.availableOps}><i className="fa fa-magic"></i></MaterialPickerButton>
                            <MaterialSaveButton className="btn btn-success btn-xs" onApplyPreset={this.preset} operation={op} types={this.availableOps}><i className="fa fa-floppy-o"></i></MaterialSaveButton>
                        </div>
                        <div className="btn-group">
                            <button className={"btn btn-warning btn-xs " + (op.enabled ? '' : 'btn-off')} onClick={this.toggleEnabled} title="Enable/Disable operation"><i className="fa fa-power-off"></i></button>
                            <button className="btn btn-default btn-xs " onClick={this.moveUp}><i className="fa fa-arrow-up"></i></button>
                            <button className="btn btn-default btn-xs" onClick={this.moveDn}><i className="fa fa-arrow-down"></i></button>
                            <button className="btn btn-danger btn-xs" onClick={this.remove}><i className="fa fa-times"></i></button>
                        </div>
                    </span>
                    {error}
                </div>
            </GetBounds>
        ];
        if (op.expanded) {
            if (!OPERATION_TYPES[op.type].skipDocs)
                rows.push(
                    <div key="docs" style={{ display: 'table-row' }} data-operation-id={op.id}>
                        <div style={leftStyle} />
                        <div style={{ display: 'table-cell' }} />
                        <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                            <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                                <thead>
                                    <tr><td colSpan='3'><center><small>Drag additional Document(s) here</small></center></td></tr>
                                </thead>
                                <tbody style={{ display: op._docs_visible ? 'block' : 'none' }}>
                                    {op.documents.map(id => {
                                        return <Doc key={id} op={op} documents={documents} id={id} isTab={false} dispatch={dispatch} />
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr><td colSpan='3' style={{ textAlign: 'right' }}><a onClick={this.toggleDocs}><small>{op._docs_visible ? 'Hide Docs' : 'Show Docs (' + op.documents.length + ')'}</small></a></td></tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
              else rows.push(
                    <div key="nodocs" style={{ display: 'table-row' }}>
                      <div style={leftStyle} />
                      <div style={{ display: 'table-cell' }} />
                      <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                          <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                              <thead>
                                  <tr><td colSpan='3'><center><small>This operation does not use a Document source</small></center></td></tr>
                              </thead>
                          </table>
                      </div>
                    </div>
                );

            rows.push(
                <div key="attrs" style={{ display: 'table-row' }}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table>
                            <tbody>
                                {Object.entries(this.operationGroups || {}).map((entry) => {
                                    let [key, group] = entry;
                                    let fields = group.fields
                                        .filter(fieldName => { let f = OPERATION_FIELDS[fieldName]; return f && (!f.condition || f.condition(op, settings)); })
                                        .map(fieldName => {
                                            return <Field
                                                key={fieldName} op={op} field={OPERATION_FIELDS[fieldName]} selected={selected}
                                                fillColors={fillColors} strokeColors={strokeColors} settings={settings}
                                                operationsBounds={bounds} setAttrs={setOperationAttrs} dispatch={dispatch} />
                                        })
                                    if (key !== '_default' && group.fields.length) {
                                        if (group.collapsible) {
                                            return <tr key={key}><td><Details className="operationGroup" handler={(<h4>{key}</h4>)}><table><tbody>{fields}</tbody></table> </Details></td></tr>
                                        } else {
                                            return <tr key={key}><td><h4>{key}</h4><table><tbody>{fields}</tbody></table></td></tr>
                                        }
                                    } else {
                                        return <tr key={key}><td><table><tbody>{fields}</tbody></table></td></tr>
                                    }

                                })}
                            </tbody>
                        </table>
                    </div>
                </div>,
            );
            if (OPERATION_TYPES[op.type].allowTabs) {
                rows.push(
                    <div key="space" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                        <div style={leftStyle} />
                        <div style={{ display: 'table-cell' }}>&nbsp;</div>
                    </div>
                );
                if (op.tabDocuments.length) {
                    rows.push(
                        <div key="tabLabel" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell' }}><b>Tabs</b></div>
                        </div>,
                        <div key="tabDocs" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                                    <tbody>
                                        {op.tabDocuments.map(id => {
                                            return <Doc key={id} op={op} documents={documents} id={id} isTab={true} dispatch={dispatch} />
                                        })}
                                        <tr><td colSpan='3'><center><small>Drag additional Document(s) here</small></center></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>,
                    );
                    if (OPERATION_TYPES[op.type].tabFields) {
                        rows.push(
                            <div key="tabattrs" style={{ display: 'table-row' }}>
                                <div style={leftStyle} />
                                <div style={{ display: 'table-cell' }} />
                                <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                    <table>
                                        <tbody>
                                            {tabFields.map(field => {
                                                return <Field key={field.name} op={op} field={field} selected={selected} operationsBounds={bounds} setAttrs={setOperationAttrs} dispatch={dispatch} />
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    }
                }
                else {
                    rows.push(
                        <div key="tabLabel" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell', border: '2px dashed #ccc' }}><b>Drag document(s) here to create tabs</b></div>
                        </div>,
                    );
                }
            } // types[op.type].allowTabs
        } // op.expanded

        return <div className={"operation-row " + (op.enabled ? "" : "disabled")} >{rows}</div>;
    }
}; // Operation

Operation = withStoredBounds(Operation);

class Operations extends React.Component {
    render() {
        let { operations, currentOperation, documents, dispatch, bounds, settings } = this.props;
        let fillColors = [];
        let strokeColors = [];
        let addColor = (colors, color) => {
            let value = JSON.stringify(color);
            if (!colors.find(c => c.value === value))
                colors.push({ value: value, color: color });
        }
        for (let doc of documents) {
            if (doc.rawPaths) {
                if (hasClosedRawPaths(doc.rawPaths))
                    addColor(fillColors, doc.fillColor);
                addColor(strokeColors, doc.strokeColor);
            }
        }
        for (let op of operations) {
            if (op.filterFillColor)
                addColor(fillColors, op.filterFillColor);
            if (op.filterStrokeColor)
                addColor(strokeColors, op.filterStrokeColor);
        }
        return (
            <div style={this.props.style}>
                <div style={{ backgroundColor: '#eee', padding: '8px 16px', border: '3px dashed #ccc', marginBottom: 5 }} data-operation-id="new">
                    <span style={{ paddingRight: '1em' }} className="fa fa-fw fa-plus"></span>
                    <b>Drag documents here from the list above</b>
                    <NoOperationsError operationsBounds={bounds} documents={documents} operations={operations} />
                </div>
                <OperationToolbar />
                <GetBounds Type={'div'} className="operations" style={{ height: "100%", overflowY: "auto" }} >
                    {operations.map(o =>
                        <Operation
                            key={o.id} op={o} selected={currentOperation === o.id} documents={documents}
                            fillColors={fillColors} strokeColors={strokeColors} settings={settings}
                            dispatch={dispatch} />
                    )}
                </GetBounds>
            </div >
        );
    }
};

Operations = connect(
    ({ operations, currentOperation, documents, settings }) => ({ operations, currentOperation, documents, settings }),
)(withGetBounds(Operations));
export { Operations };


class OperationToolbar extends React.Component {

    constructor(props) {
        super(props);
        this.handleAddSingle.bind(this)
        this.handleAddMultiple.bind(this)
        this.handleClearAll.bind(this)
    }

    handleAddSingle() {
        this.props.createSingle(selectedDocuments(this.props.documents));
    }

    handleAddMultiple() {
        this.props.createMultiple(selectedDocuments(this.props.documents));
    }

    handleClearAll() {
        this.props.clearAll();
    }

    render() {
        let hasSelected = this.props.documents.some((item) => item.selected)
        let settings = this.props.settings;
        return <ButtonToolbar style={{ paddingBottom: "5px", marginBottom: "5px", borderBottom: "1px solid #eee" }}>
            <Button disabled={!hasSelected && !settings.toolCreateEmptyOps} onClick={(e) => { this.handleAddSingle() }} bsSize="xsmall" bsStyle="info" title="Create a single operation with the selected documents"><Icon name="object-group" /> Create Single </Button>
            <Button disabled={!hasSelected} onClick={(e) => { this.handleAddMultiple() }} bsSize="xsmall" bsStyle="info" title="Create operations with each of the selected documents"><Icon name="object-ungroup" /> Create Multiple </Button>
            <Button disabled={!this.props.operations.length} onClick={e => this.handleClearAll()} bsStyle="danger" bsSize="xsmall" title="Clear all operations" >Clear All</Button>
        </ButtonToolbar>
    }
}

OperationToolbar = connect(
    (state) => { return { documents: state.documents, operations: state.operations, settings: state.settings } },
    (dispatch) => {
        return {
            createSingle: (documents) => { dispatch(addOperation({ documents })) },
            createMultiple: (documents) => { documents.forEach((doc) => { dispatch(addOperation({ documents: [doc] })) }) },
            clearAll: () => {
                confirm("Are you sure?", (data) => {
                    if (data) dispatch(clearOperations());
                })
            }
        }
    }
)(OperationToolbar);
