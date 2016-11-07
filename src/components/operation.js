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

import { addOperation, removeOperation, operationAddDocuments, setCurrentOperation, operationRemoveDocument, setOperationAttrs } from '../actions/operation';

function NumberInput({op, field, onChange, onFocus}) {
    return (
        <input type='number' step='any' value={op[field.name]} style={{ width: "100%" }} onChange={onChange} onFocus={onFocus} />
    );
}

function DirectionInput({op, field, onChange, onFocus}) {
    return (
        <select value={op[field.name]} style={{ width: "100%" }} onChange={onChange} onFocus={onFocus} >
            <option>Conventional</option>
            <option>Climb</option>
        </select>
    );
}

class Field extends React.Component {
    componentWillMount() {
        this.onChange = e => {
            this.props.dispatch(setOperationAttrs({ [this.props.field.name]: e.target.value }, this.props.op.id));
        };
        this.onFocus = e => {
            if (!this.props.selected)
                this.props.dispatch(setCurrentOperation(this.props.op.id));
        };
    }

    render() {
        let {op, field} = this.props;
        let Input = field.input;
        let error;
        if (field.check && !field.check(op[field.name]))
            error = <td className='error-bubble' data-error={field.error} />;
        return (
            <tr>
                <td>{field.label}</td>
                <td><Input op={op} field={field} onChange={this.onChange} onFocus={this.onFocus} /></td>
                <td>{field.units}</td>
                {error}
            </tr>
        );
    }
};

class Doc extends React.Component {
    componentWillMount() {
        this.remove = e => {
            this.props.dispatch(operationRemoveDocument(this.props.op.id, this.props.id));
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

const checkPercent = {
    check: v => v >= 0 && v <= 100,
    error: 'Must be between 0 and 100',
};

const checkStepOver = {
    check: v => v > 0 && v <= 1,
    error: 'Must be in range (0, 1]',
};

const fields = {
    direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput },

    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput, ...checkPercent },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput, ...checkPositive },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput, ...checkPositive },

    margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '(0,1]', input: NumberInput, ...checkStepOver },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput, ...checkPositive },
    cutDepth: { name: 'cutDepth', label: 'Final Cut Depth', units: 'mm', input: NumberInput, ...checkPositive },

    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput, ...checkPositive },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput, ...checkPositive },
};

const types = {
    'Laser Engrave': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Laser Inside': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Laser Outside': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Mill Pocket': { fields: ['direction', 'margin', 'cutDepth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Engrave': { fields: ['direction', 'cutDepth', 'passDepth', 'plungeRate', 'cutRate'] },
    'Mill Inside': { fields: ['direction', 'margin', 'cutDepth', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Outside': { fields: ['direction', 'margin', 'cutDepth', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
};

class Operation extends React.Component {
    componentWillMount() {
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
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
            this.props.dispatch(operationAddDocuments(this.props.op.id, documents));
            e.preventDefault();
        }
    }

    render() {
        let {op, documents, onDragOver, selected, dispatch} = this.props;
        let showError = false;
        if (!op.expanded) {
            for (let fieldName of types[op.type].fields) {
                let field = fields[fieldName];
                if (field.check && !field.check(op[fieldName]))
                    showError = true;
            }
        }

        let leftStyle;
        if (selected)
            leftStyle = { display: 'table-cell', borderLeft: '4px solid blue', borderRight: '4px solid transparent' };
        else
            leftStyle = { display: 'table-cell', borderLeft: '4px solid transparent', borderRight: '4px solid transparent' };

        let rows = [
            <div key="header" style={{ display: 'table-row' }}>
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
                </div>
                {showError ? <div className="error-bubble" data-error="Expand to setup operation" /> : undefined}
            </div>
        ];
        if (op.expanded)
            rows.push(
                <div key="docs" style={{ display: 'table-row' }}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {op.documents.map(id => {
                                    return <Doc key={id} op={op} documents={documents} id={id} dispatch={dispatch} />
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
                                    return <Field key={fieldName} op={op} field={fields[fieldName]} selected={selected} dispatch={dispatch} />
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        return <div className="operation-row" onDragOver={this.onDragOver} onDrop={this.onDrop}>{rows}</div>;
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
        let {operations, currentOperation, documents, dispatch } = this.props;
        return (
            <div>
                <div style={{ backgroundColor: 'cyan', padding: '20px' }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
                    <b>Drag document(s) here</b>
                </div>
                <br />
                <div className="operations" style={{ display: 'table' }}>
                    {operations.map(o =>
                        <Operation key={o.id} op={o} selected={currentOperation === o.id} documents={documents} dispatch={dispatch} />
                    )}
                </div>
            </div>
        );
    }
};
Operations = connect(
    ({operations, currentOperation, documents}) => ({ operations, currentOperation, documents }),
)(Operations);
export { Operations };
