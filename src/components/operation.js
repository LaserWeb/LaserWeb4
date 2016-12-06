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

import { addOperation, removeOperation, operationAddDocuments, setCurrentOperation, operationRemoveDocument, setOperationAttrs } from '../actions/operation';
import { Input } from './forms.js';
import { GetBounds, withGetBounds, withStoredBounds } from './get-bounds.js';

function NumberInput(props) {
    let {op, field, fillColors, strokeColors, ...rest} = props;
    return <Input type='number' step='any' value={op[field.name]} style={{ width: "100%" }} {...rest } />;
}

function DirectionInput({op, field, onChangeValue, fillColors, strokeColors, ...rest}) {
    return (
        <select value={op[field.name]} style={{ width: "100%" }} {...rest} >
            <option>Conventional</option>
            <option>Climb</option>
        </select>
    );
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
        let {op, field, onChange, onChangeValue, fillColors, strokeColors, ...rest} = this.props;
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

function Error(props) {
    let {bounds, operationsBounds, message} = props;
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

class Field extends React.Component {
    componentWillMount() {
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    onChangeValue(v) {
        let {op, field} = this.props;
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
        let {op, field, operationsBounds, fillColors, strokeColors} = this.props;
        let Input = field.input;
        let error;
        if (field.check && !field.check(op[field.name]))
            error = <Error operationsBounds={operationsBounds} message={field.error} />;
        return (
            <GetBounds Type="tr">
                <td>{field.label}</td>
                <td>
                    <Input
                        op={op} field={field} fillColors={fillColors} strokeColors={strokeColors}
                        onChange={this.onChange} onChangeValue={this.onChangeValue} onFocus={this.onFocus} />
                </td>
                <td>{field.units}{error}</td>
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
        let {op, documents, id} = this.props;
        return (
            <tr>
                <td style={{ width: '100%' }}>
                    {documents.find(d => d.id === id).name}
                </td>
                <td>
                    <button className="btn btn-danger btn-xs" onClick={this.remove}>
                        <i className="fa fa-times"></i>
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

const checkPercent = {
    check: v => v >= 0 && v <= 100,
    error: 'Must be in range [0, 100]',
};

const checkStepOver = {
    check: v => v > 0 && v <= 1,
    error: 'Must be in range (0, 1]',
};

const checkToolAngle = {
    check: v => v > 0 && v < 180,
    error: 'Must be in range (0, 180)',
};

export const fields = {
    filterFillColor: { name: 'filterFillColor', label: 'Filter Fill', units: '', input: FilterInput },
    filterStrokeColor: { name: 'filterStrokeColor', label: 'Filter Stroke', units: '', input: FilterInput },
    direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput },

    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput, ...checkPercent },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    toolAngle: { name: 'toolAngle', label: 'Tool Angle', units: 'deg', input: NumberInput, ...checkToolAngle },

    margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput },
    passes: { name: 'passes', label: 'Passes', units: '', input: NumberInput, ...checkPositiveInt },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '(0,1]', input: NumberInput, ...checkStepOver },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput, ...checkPositive },
    cutDepth: { name: 'cutDepth', label: 'Final Cut Depth', units: 'mm', input: NumberInput, ...checkPositive },
    clearance: { name: 'clearance', label: 'Clearance', units: 'mm', input: NumberInput, ...checkGE0 },

    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput, ...checkPositive },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput, ...checkPositive },
};


const tabFields = [
    { name: 'tabDepth', label: 'Tab Depth', units: 'mm', input: NumberInput, ...checkGE0 },
];

export const types = {
    'Laser Cut': { allowTabs: true, tabFields: false, fields: ['filterFillColor', 'filterStrokeColor', 'laserPower', 'passes', 'cutRate'] },
    'Laser Cut Inside': { allowTabs: true, tabFields: false, fields: ['filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'cutRate'] },
    'Laser Cut Outside': { allowTabs: true, tabFields: false, fields: ['filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'cutRate'] },
    'Mill Pocket': { allowTabs: true, tabFields: true, fields: ['filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth', 'clearance', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Cut': { allowTabs: true, tabFields: true, fields: ['filterFillColor', 'filterStrokeColor', 'direction', 'cutDepth', 'clearance', 'passDepth', 'plungeRate', 'cutRate'] },
    'Mill Cut Inside': { allowTabs: true, tabFields: true, fields: ['filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth', 'clearance', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Cut Outside': { allowTabs: true, tabFields: true, fields: ['filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'cutDepth', 'clearance', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill V Carve': { allowTabs: false, fields: ['filterFillColor', 'filterStrokeColor', 'direction', 'toolAngle', 'clearance', 'passDepth', 'plungeRate', 'cutRate'] },
};

class Operation extends React.Component {
    componentWillMount() {
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDropTabs = this.onDropTabs.bind(this);
        this.setType = e => this.props.dispatch(setOperationAttrs({ type: e.target.value }, this.props.op.id));
        this.toggleExpanded = e => this.props.dispatch(setOperationAttrs({ expanded: !this.props.op.expanded }, this.props.op.id));
        this.remove = e => this.props.dispatch(removeOperation(this.props.op.id));
    }

    onDragOver(e) {
        if (e.nativeEvent.dataTransfer.types.includes('laserweb/docids')) {
            e.nativeEvent.dataTransfer.dropEffect = "copy";
            e.preventDefault();
        }
    }

    onDrop(e) {
        if (e.nativeEvent.dataTransfer.types.includes('laserweb/docids')) {
            let documents = e.nativeEvent.dataTransfer.getData('laserweb/docids').split(',');
            this.props.dispatch(operationAddDocuments(this.props.op.id, false, documents));
            e.preventDefault();
        }
    }

    onDropTabs(e) {
        if (e.nativeEvent.dataTransfer.types.includes('laserweb/docids')) {
            let documents = e.nativeEvent.dataTransfer.getData('laserweb/docids').split(',');
            this.props.dispatch(operationAddDocuments(this.props.op.id, true, documents));
            e.preventDefault();
        }
    }

    render() {
        let {op, documents, onDragOver, selected, operationsBounds, dispatch, fillColors, strokeColors} = this.props;
        let error;
        if (!op.expanded) {
            for (let fieldName of types[op.type].fields) {
                let field = fields[fieldName];
                if (field.check && !field.check(op[fieldName])) {
                    error = <Error operationsBounds={operationsBounds} message="Expand to setup operation" />;
                    break;
                }
            }
        }

        let leftStyle;
        if (selected)
            leftStyle = { display: 'table-cell', borderLeft: '4px solid blue', borderRight: '4px solid transparent' };
        else
            leftStyle = { display: 'table-cell', borderLeft: '4px solid transparent', borderRight: '4px solid transparent' };

        let rows = [
            <GetBounds Type="div" key="header" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
                <div style={leftStyle} />
                <div style={{ display: 'table-cell' }}>
                    <i
                        onClick={this.toggleExpanded}
                        className={op.expanded ? 'fa fa-minus-square-o' : 'fa fa-plus-square-o'} />
                </div>
                <div style={{ display: 'table-cell', width: '100%' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <select value={op.type} onChange={this.setType}>
                            {Object.keys(types).map(type => <option key={type}>{type}</option>)}
                        </select>
                        <button className="btn btn-danger btn-xs" onClick={this.remove}>
                            <i className="fa fa-times"></i>
                        </button>
                    </span>
                    {error}
                </div>
            </GetBounds>
        ];
        if (op.expanded) {
            rows.push(
                <div key="docs" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {op.documents.map(id => {
                                    return <Doc key={id} op={op} documents={documents} id={id} isTab={false} dispatch={dispatch} />
                                })}
                                <tr><td>&nbsp;</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>,
                <div key="attrs" style={{ display: 'table-row' }}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table>
                            <tbody>
                                {types[op.type].fields.map(fieldName => {
                                    return <Field
                                        key={fieldName} op={op} field={fields[fieldName]} selected={selected}
                                        fillColors={fillColors} strokeColors={strokeColors}
                                        operationsBounds={operationsBounds} dispatch={dispatch} />
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>,
            );
            if (types[op.type].allowTabs) {
                rows.push(
                    <div key="space" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDropTabs}>
                        <div style={leftStyle} />
                        <div style={{ display: 'table-cell' }}>&nbsp;</div>
                    </div>
                );
                if (op.tabDocuments.length) {
                    rows.push(
                        <div key="tabLabel" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDropTabs}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell' }}><b>Tabs</b></div>
                        </div>,
                        <div key="tabDocs" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDropTabs}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                <table style={{ width: '100%' }}>
                                    <tbody>
                                        {op.tabDocuments.map(id => {
                                            return <Doc key={id} op={op} documents={documents} id={id} isTab={true} dispatch={dispatch} />
                                        })}
                                        <tr><td>&nbsp;</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>,
                    );
                    if (types[op.type].tabFields) {
                        rows.push(
                            <div key="tabattrs" style={{ display: 'table-row' }}>
                                <div style={leftStyle} />
                                <div style={{ display: 'table-cell' }} />
                                <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                    <table>
                                        <tbody>
                                            {tabFields.map(field => {
                                                return <Field key={field.name} op={op} field={field} selected={selected} operationsBounds={operationsBounds} dispatch={dispatch} />
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
                        <div key="tabLabel" style={{ display: 'table-row' }} onDragOver={this.onDragOver} onDrop={this.onDropTabs}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell' }}><b>Drag document(s) here to create tabs</b></div>
                        </div>,
                    );
                }
            } // types[op.type].allowTabs
        } // op.expanded
        return <div className="operation-row">{rows}</div>;
    }
};

class Operations extends React.Component {
    componentWillMount() {
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    onDragOver(e) {
        if (e.nativeEvent.dataTransfer.types.includes('laserweb/docids')) {
            e.nativeEvent.dataTransfer.dropEffect = "copy";
            e.preventDefault();
        }
    }

    onDrop(e) {
        if (e.nativeEvent.dataTransfer.types.includes('laserweb/docids')) {
            let documents = e.nativeEvent.dataTransfer.getData('laserweb/docids').split(',');
            this.props.dispatch(addOperation({ documents }));
            e.preventDefault();
        }
    }

    render() {
        let {operations, currentOperation, documents, dispatch, bounds } = this.props;
        let fillColors = [];
        let strokeColors = [];
        let addColor = (colors, color) => {
            let value = JSON.stringify(color);
            if (!colors.find(c => c.value === value))
                colors.push({ value: value, color: color });
        }
        for (let doc of documents) {
            if (doc.type === 'path') {
                addColor(fillColors, doc.fillColor);
                addColor(strokeColors, doc.strokeColor);
            }
        }
        return (
            <div style={this.props.style}>
                <div style={{ backgroundColor: 'cyan', padding: '20px' }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
                    <b>Drag document(s) here</b>
                </div>
                <br />
                <div className="operations" style={{ display: 'table' }}>
                    {operations.map(o =>
                        <Operation
                            key={o.id} op={o} selected={currentOperation === o.id} documents={documents}
                            fillColors={fillColors} strokeColors={strokeColors}
                            operationsBounds={bounds} dispatch={dispatch} />
                    )}
                </div>
            </div >
        );
    }
};
Operations = connect(
    ({operations, currentOperation, documents}) => ({ operations, currentOperation, documents }),
)(withGetBounds(Operations));
export { Operations };
