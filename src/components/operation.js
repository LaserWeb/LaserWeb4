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

import { removeOperation, moveOperation, setCurrentOperation, operationRemoveDocument, setOperationAttrs } from '../actions/operation';
import { selectDocument } from '../actions/document'
import { addOperation } from '../actions/operation'
import { hasClosedRawPaths } from '../lib/mesh';
import { Input } from './forms.js';
import { GetBounds, withGetBounds, withStoredBounds } from './get-bounds.js';
import { selectedDocuments } from './document'

import Toggle from 'react-toggle';
import { isObject } from '../lib/helpers';

import { MaterialPickerButton } from './material-database'

import { ButtonToolbar, Button, ButtonGroup } from 'react-bootstrap';
import Icon from './font-awesome'

import { Details } from './material-database'

function StringInput(props) {
    let { op, field, fillColors, strokeColors, ...rest } = props;
    return <Input value={op[field.name]}  {...rest } />;
}

function NumberInput(props) {
    let { op, field, fillColors, strokeColors, ...rest } = props;
    return <Input type='number' step='any' value={op[field.name]}   {...rest } />;
}

function DirectionInput({ op, field, onChangeValue, fillColors, strokeColors, ...rest }) {
    return (
        <select value={op[field.name]}  {...rest} >
            <option>Conventional</option>
            <option>Climb</option>
        </select>
    );
}

function GrayscaleInput({ op, field, onChangeValue, fillColors, strokeColors, ...rest }) {
    return (
        <select value={op[field.name]}  {...rest} >
            <option>none</option>
            <option>average</option>
            <option>luma</option>
            <option>luma-601</option>
            <option>luma-709</option>
            <option>luma-240</option>
            <option>desaturation</option>
            <option>decomposition-min</option>
            <option>decomposition-max</option>
            <option>red-chanel</option>
            <option>green-chanel</option>
            <option>blue-chanel</option>
        </select>
    );
}

function CheckboxInput({ op, field, onChangeValue, fillColors, strokeColors, ...rest }) {
    return <input {...rest} checked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} type="checkbox" />
}

function ToggleInput({ op, field, onChangeValue, fillColors, strokeColors, className = "scale75", ...rest }) {
    return <Toggle id={"toggle_" + op.id + "_" + field} defaultChecked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} className={className} />
}


class InputRange extends React.Component {

    constructor(props) {
        super(props);
        this.handleChange.bind(this)
        this.state = Object.assign({ min: this.props.minValue, max: this.props.maxValue }, this.props.value);
    }

    handleChange(key, v) {
        let state = Object.assign(this.state, { [key]: parseFloat(v) })
        state.min = Math.max(Math.min(this.props.maxValue, state.min), this.props.minValue)
        state.max = Math.max(Math.min(this.props.maxValue, state.max), this.props.minValue)


        this.setState(state)
        this.props.onChangeValue(state);
    }

    render() {
        let { min, max } = this.state;
        return <div>
            <label style={{ whiteSpace: "nowrap" }} >Min <input size="3" style={{ display: "inline-block" }} type='number' placeholder={this.props.minValue} min={this.props.minValue} max={this.props.maxValue} step='any' onChange={(e) => this.handleChange('min', e.target.value)} value={min} /></label>
            <label style={{ whiteSpace: "nowrap" }} >Max <input size="3" style={{ display: "inline-block" }} type='number' placeholder={this.props.maxValue} max={this.props.maxValue} min={this.props.minValue} step='any' onChange={(e) => this.handleChange('max', e.target.value)} value={max} /></label>
        </div>
    }
}

function RangeInput(minValue, maxValue) {
    return ({ op, field, onChangeValue, ...rest }) => {
        return <InputRange maxValue={maxValue} minValue={minValue} value={op[field.name]} onChangeValue={value => onChangeValue(value)} />
    }
}

function TagInput(statekey, opts = { multi: true, simpleValue:true, delimiter:',', clearable:true }, connector) {

    if (!connector) connector = (state) => { return { options: Object.entries(state[statekey]).map(i => { return { label: i[1].label, value: i[0] } }) } }
    return connect(connector)(React.createClass({
        render: function() {
            return <Select options={this.props.options} value={this.props.op[this.props.field.name]} onChange={e => this.props.onChangeValue(e)} {...{...opts}} />
        }
    }))

}

function ColorBox(v) {
    let rgb = 'rgb(' + v.color[0] * 255 + ',' + v.color[1] * 255 + ',' + v.color[2] * 255 + ')';
    return (
        <span style={{ backgroundColor: rgb, width: 40, display: 'inline-block' }}>&nbsp;</span>
    );
}

class FilterInput extends React.Component {
    componentWillMount() {
        this.onChange = this.onChange.bind(this);
    }

    onChange(v) {
        if (v)
            this.props.onChangeValue(JSON.parse(v.value));
        else
            this.props.onChangeValue(null);
    }

    render() {
        let { op, field, onChange, onChangeValue, fillColors, strokeColors, ...rest } = this.props;
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
    componentWillMount() {
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    onChangeValue(v) {
        let { op, field } = this.props;
        if (op[field.name] !== v)
            this.props.dispatch(setOperationAttrs({ [field.name]: v }, op.id));
    }

    onChange(e) {
        this.onChangeValue(e.target.value);
    }

    onFocus(e) {
        if (!this.props.selected)
            this.props.dispatch(setCurrentOperation(this.props.op.id));
    }

    render() {
        let { op, field, operationsBounds, fillColors, strokeColors, settings } = this.props;
        let Input = field.input;
        let { units } = field;
        let error;
        if (units === 'mm/min' && settings.toolFeedUnits === 'mm/s')
            units = settings.toolFeedUnits;
        if (field.check && !field.check(op[field.name], settings, op))
            error = <Error operationsBounds={operationsBounds} message={(typeof field.error == 'function') ? field.error(op[field.name], settings, op) : field.error} />;
        return (
            <GetBounds Type="tr">
                <th width="30%">{field.label}</th>
                <td>
                    <Input
                        op={op} field={field} fillColors={fillColors} strokeColors={strokeColors}
                        onChange={this.onChange} onChangeValue={this.onChangeValue} onFocus={this.onFocus} />
                </td>
                <td>{units}{error}</td>
            </GetBounds>
        );
    }
};

class Doc extends React.Component {
    componentWillMount() {
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

const ifUseA = {
    condition: op => op.useA
};

const checkZHeight = {
    check: (v, settings) => settings.machineZEnabled && v && !isNaN(v),
    error: (v, settings) => {
        if (!settings.machineZEnabled) return 'Laser Z Stage must be enabled';
        return 'Has to be a number'
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

const checkPassDepth = {
    check: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.check(v, settings, op) : checkPositive.check(v, settings, op) },
    error: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.error : checkPositive.error },
}

export const OPERATION_FIELDS = {
    name: { name: 'name', label: 'Name', units: '', input: StringInput },

    filterFillColor: { name: 'filterFillColor', label: 'Filter Fill', units: '', input: FilterInput },
    filterStrokeColor: { name: 'filterStrokeColor', label: 'Filter Stroke', units: '', input: FilterInput },
    direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput },

    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput, ...checkPercent },
    laserPowerRange: { name: 'laserPowerRange', label: 'Laser Power Range', units: '%', input: RangeInput(0, 100), ...checkRange(0, 100) },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    lineDistance: { name: 'lineDistance', label: 'Line Distance', units: 'mm', input: NumberInput, ...checkPositive },
    lineAngle: { name: 'lineAngle', label: 'Line Angle', units: 'deg', input: NumberInput },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    toolAngle: { name: 'toolAngle', label: 'Tool Angle', units: 'deg', input: NumberInput, ...checkToolAngle },

    margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput },
    passes: { name: 'passes', label: 'Passes', units: '', input: NumberInput, ...checkPositiveInt },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '%', input: NumberInput, ...checkStepOver },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput, ...checkPassDepth, ...ifUseZ },
    cutDepth: { name: 'cutDepth', label: 'Final Cut Depth', units: 'mm', input: NumberInput, ...checkPositive },
    startHeight: { name: 'startHeight', label: 'Start Height', units: 'mm', input: StringInput, ...checkZHeight, ...ifUseZ },
    clearance: { name: 'clearance', label: 'ZClearance', units: 'mm', input: NumberInput, ...checkGE0 },
    segmentLength: { name: 'segmentLength', label: 'Segment', units: 'mm', input: NumberInput, ...checkGE0 },

    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput, ...checkPositive },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput, ...checkPositive },

    useA: { name: 'useA', label: 'Use A Axis', units: '', input: ToggleInput },
    aAxisStepsPerTurn: { name: 'aAxisStepsPerTurn', label: 'A Resolution', units: 'steps/turn', input: NumberInput, ...checkPositive, ...ifUseA },
    aAxisDiameter: { name: 'aAxisDiameter', label: 'A Diameter', units: 'mm', input: NumberInput, ...checkPositive, ...ifUseA },

    useBlower: { name: 'useBlower', label: 'Use Air Assist', units: '', input: ToggleInput, ...ifUseBlower },

    smoothing: { name: 'smoothing', label: 'Smoothing', units: '', input: ToggleInput },                                // lw.raster-to-gcode: Smoothing the input image ?
    brightness: { name: 'brightness', label: 'Brightness', units: '', input: NumberInput, ...checkRange(-255, 255) },   // lw.raster-to-gcode: Image brightness [-255 to +255]
    contrast: { name: 'contrast', label: 'Contrast', units: '', input: NumberInput, ...checkRange(-255, 255) },         // lw.raster-to-gcode: Image contrast [-255 to +255]
    gamma: { name: 'gamma', label: 'Gamma', units: '', input: NumberInput, ...checkRange(0, 7.99) },                    // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
    grayscale: { name: 'grayscale', label: 'Grayscale', units: '', input: GrayscaleInput },                             // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
    shadesOfGray: { name: 'shadesOfGray', label: 'Shades', units: '', input: NumberInput, ...checkRange(2, 256) },      // lw.raster-to-gcode: Number of shades of gray [2-256]
    invertColor: { name: 'invertColor', label: 'Invert Color', units: '', input: ToggleInput },                         // lw.raster-to-gcode
    trimLine: { name: 'trimLine', label: 'Trim Pixels', units: '', input: ToggleInput },                                // lw.raster-to-gcode: Trim trailing white pixels
    joinPixel: { name: 'joinPixel', label: 'Join Pixels', units: '', input: ToggleInput },                              // lw.raster-to-gcode: Join consecutive pixels with same intensity
    burnWhite: { name: 'burnWhite', label: 'Burn White', units: '', input: ToggleInput },                               // lw.raster-to-gcode: [true = G1 S0 | false = G0] on inner white pixels
    verboseGcode: { name: 'verboseGcode', label: 'Verbose GCode', units: '', input: ToggleInput },                      // lw.raster-to-gcode: Output verbose GCode (print each commands)
    diagonal: { name: 'diagonal', label: 'Diagonal', units: '', input: ToggleInput },                                   // lw.raster-to-gcode: Go diagonally (increase the distance between points)
    dithering: { name: 'dithering', label: 'Dithering', units: '', input: ToggleInput },                                   // lw.raster-to-gcode: Go diagonally (increase the distance between points)
    overScan: { name: 'overScan', label: 'Over Scan', units: 'mm', input: NumberInput, ...checkGE0 },               // lw.raster-to-gcode: This feature add some extra white space before and after each line. This leaves time to reach the feed rate before starting to engrave and can prevent over burning the edges of the raster.

    hookOperationStart: { name: 'hookOperationStart', label: 'Pre Op', units: '', input: TagInput('macros') },
    hookOperationEnd: { name: 'hookOperationEnd', label: 'Post Op', units: '', input: TagInput('macros') },
    hookPassStart: { name: 'hookPassStart', label: 'Pre Pass', units: '', input: TagInput('macros') },
    hookPassEnd: { name: 'hookPassEnd', label: 'Post Pass', units: '', input: TagInput('macros') },
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
    'Laser Cut': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserPower', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisStepsPerTurn', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Cut Inside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisStepsPerTurn', 'aAxisDiameter', 'useBlower', 'segmentLength',...OPERATION_GROUPS.Macros.fields] },
    'Laser Cut Outside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisStepsPerTurn', 'aAxisDiameter', 'useBlower', 'segmentLength',...OPERATION_GROUPS.Macros.fields] },
    'Laser Fill Path': { allowTabs: false, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisStepsPerTurn', 'aAxisDiameter', 'useBlower', ...OPERATION_GROUPS.Macros.fields] },
    'Laser Raster': {
            allowTabs: false, tabFields: false, fields: [
                'name', 'laserPowerRange', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower',
                'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'diagonal', 'overScan', 'useA',
                 ...OPERATION_GROUPS.Filters.fields, ...OPERATION_GROUPS.Macros.fields
            ] },
    'Mill Pocket': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth', 'passDepth', 'clearance', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate',  'segmentLength', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'cutDepth', 'passDepth', 'clearance',  'segmentLength', 'plungeRate', 'cutRate', 'segmentLength', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut Inside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth',  'passDepth', 'clearance', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate',  'segmentLength', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill Cut Outside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth', 'passDepth', 'clearance', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate',  'segmentLength', 'hookOperationStart', 'hookOperationEnd'] },
    'Mill V Carve': { allowTabs: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'toolAngle', 'clearance', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'hookOperationStart', 'hookOperationEnd'] },
};

const groupFields = (ofields) => {
    let groups = { '_default': { visible: true, collapsible: false, fields: [] } };
    let fields=ofields.slice();

    Object.entries(OPERATION_GROUPS).forEach(entry => {
        let [key, group] = entry;
        if (!groups.hasOwnProperty(key)) {
            groups[key] = Object.assign({}, group)
            groups[key].fields = []
        }
        group.fields.forEach(field => {
            let index=fields.indexOf(field);
            if (index>-1)
                groups[key].fields.push(fields.splice(index,1).pop())

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

    componentWillMount() {
        this.setType = e => this.props.dispatch(setOperationAttrs({ type: e.target.value }, this.props.op.id));
        this.setTypeString = e => this.props.dispatch(setOperationAttrs({ type: e }, this.props.op.id));
        this.toggleExpanded = e => this.props.dispatch(setOperationAttrs({ expanded: !this.props.op.expanded }, this.props.op.id));
        this.toggleEnabled = e => this.props.dispatch(setOperationAttrs({ enabled: !this.props.op.enabled }, this.props.op.id));
        this.remove = e => this.props.dispatch(removeOperation(this.props.op.id));
        this.moveUp = e => this.props.dispatch(moveOperation(this.props.op.id, -1));
        this.moveDn = e => this.props.dispatch(moveOperation(this.props.op.id, +1));
        this.preset = (type, attrs) => this.props.dispatch(setOperationAttrs({ type: type, ...attrs }, this.props.op.id))
        this.toggleDocs = e => this.props.dispatch(setOperationAttrs({ _docs_visible: !this.props.op._docs_visible }, this.props.op.id));

        this.documentsCount = null;
        this.documentTypes = { vectors: 0, images: 0 };
        this.availableOps = Object.keys(OPERATION_TYPES);
        this.operationGroups = groupFields(OPERATION_TYPES[this.props.op.type].fields)
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.op.documents.length !== this.documentsCount) {
            this.documentsCount = nextProps.op.documents.length
            this.documentTypes = traverseDocumentTypes(nextProps.op.documents, nextProps.documents)
            this.availableOps = Object.keys(OPERATION_TYPES);
            if (nextProps.op.documents.length) {
                if (!this.documentTypes.vectors) this.availableOps = this.availableOps.filter(item => item.match(/Raster/gi))
                if (!this.documentTypes.images) this.availableOps = this.availableOps.filter(item => !item.match(/Raster/gi))

                if (!this.availableOps.includes(nextProps.op.type))
                    this.setTypeString(this.availableOps[0])
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.op.type != this.props.op.type) {
            this.operationGroups = groupFields(OPERATION_TYPES[this.props.op.type].fields)
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



        let millFilter = (item) => settings.toolCncMode ? true : !item.match(/Mill/gi)

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
                            <select className="input-xs" value={op.type} onChange={this.setType}>{Object.keys(OPERATION_TYPES).filter(millFilter).map(type => <option key={type} disabled={!this.availableOps.includes(type)}>{type}</option>)}</select>
                            <MaterialPickerButton className="btn btn-success btn-xs" onApplyPreset={this.preset} operation={op} ><i className="fa fa-magic"></i></MaterialPickerButton>
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
            rows.push(
                <div key="docs" style={{ display: 'table-row' }} data-operation-id={op.id}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                            <thead>
                                <tr><td colSpan='3'><center><small>Drag additional Document(s) here</small><br /><small>to add to existing operation</small></center></td></tr>
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
                </div>,
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
                                                operationsBounds={bounds} dispatch={dispatch} />
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
                                                return <Field key={field.name} op={op} field={field} selected={selected} operationsBounds={bounds} dispatch={dispatch} />
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
                <div style={{ backgroundColor: '#eee', padding: '20px', border: '3px dashed #ccc', marginBottom: 5 }} data-operation-id="new">
                    <b>Drag document(s) here</b> or<br /><OperationToolbar />
                    <NoOperationsError operationsBounds={bounds} documents={documents} operations={operations} />
                </div>
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
    }

    handleAddSingle() {
        this.props.createSingle(selectedDocuments(this.props.documents));
    }

    handleAddMultiple() {
        this.props.createMultiple(selectedDocuments(this.props.documents));
    }

    render() {
        let hasSelected = this.props.documents.some((item) => item.selected)
        return <ButtonToolbar>
            <Button disabled={!hasSelected} onClick={(e) => { this.handleAddSingle() }} bsSize="xsmall" bsStyle="info" title="Create a single operation with the selected documents"><Icon name="object-group" /> Create Single </Button>
            <Button disabled={!hasSelected} onClick={(e) => { this.handleAddMultiple() }} bsSize="xsmall" bsStyle="info" title="Create operations with each of the selected documents"><Icon name="object-ungroup" /> Create Multiple </Button>
        </ButtonToolbar>
    }
}

OperationToolbar = connect(
    (state) => { return { documents: state.documents } },
    (dispatch) => {
        return {
            createSingle: (documents) => { dispatch(addOperation({ documents })) },
            createMultiple: (documents) => { documents.forEach((doc) => { dispatch(addOperation({ documents: [doc] })) }) }
        }
    }
)(OperationToolbar);
