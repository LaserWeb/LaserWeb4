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

import { addOperation, removeOperation, setOperationAttrs } from '../actions/operation';

function NumberInput({op, field, onChange}) {
    return (
        <input type='number' step='any' value={op[field.name]} style={{ width: "100%" }} onChange={onChange} />
    );
}

function DirectionInput({op, field, onChange}) {
    return (
        <select value={op[field.name]} style={{ width: "100%" }} onChange={onChange} >
            <option>Conventional</option>
            <option>Climb</option>
        </select>
    );
}

class Field extends React.Component {
    componentWillMount() {
        this.onChange = e => {
            this.props.dispatch(setOperationAttrs({ [this.props.field.name]: e.target.value }, this.props.op.id));
        }
    }

    render() {
        let {op, field} = this.props;
        let Input = field.input;
        return (
            <tr>
                <td>{field.label}</td>
                <td><Input op={op} field={field} onChange={this.onChange} /></td>
                <td>{field.units}</td>
            </tr>
        );
    }
};
Field = connect()(Field);

const fields = {
    direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput },

    laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput },
    laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput },
    toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput },

    margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput },
    cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput },
    stepOver: { name: 'stepOver', label: 'Step Over', units: '(0,1]', input: NumberInput },
    passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput },
    cutDepth: { name: 'cutDepth', label: 'Final Cut Depth', units: 'mm', input: NumberInput },

    plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput },
    cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput },
};

const types = {
    'Laser Engrave': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Laser Inside': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Laser Outside': { fields: ['cutDepth', 'laserDiameter', 'laserPower', 'passDepth', 'cutRate'] },
    'Mill Pocket': { fields: ['direction', 'margin', 'cutDepth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Engrave': { fields: ['direction', 'cutDepth', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Inside': { fields: ['direction', 'margin', 'cutDepth', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
    'Mill Outside': { fields: ['direction', 'margin', 'cutDepth', 'cutWidth', 'toolDiameter', 'passDepth', 'stepOver', 'plungeRate', 'cutRate'] },
};

class Operation extends React.Component {
    componentWillMount() {
        this.setType = e => this.props.dispatch(setOperationAttrs({ type: e.target.value }, this.props.op.id));
        this.toggleExpanded = e => this.props.dispatch(setOperationAttrs({ expanded: !this.props.op.expanded }, this.props.op.id));
        this.remove = e => this.props.dispatch(removeOperation(this.props.op.id));
    }

    render() {
        let {op} = this.props;
        let rows = [
            <div key="1" style={{ display: 'table-row' }}>
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
            </div>
        ];
        if (op.expanded)
            rows.push(
                <div key="2" style={{ display: 'table-row' }}>
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table>
                            <tbody>
                                {types[op.type].fields.map(fieldName => {
                                    return <Field key={fieldName} op={op} field={fields[fieldName]} />
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
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
        return (
            <div>
                <div style={{ backgroundColor: 'cyan', padding: '20px' }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
                    <b>Drag document(s) here</b>
                </div>
                <br />
                <div className="operations" style={{ display: 'table' }}>
                    {this.props.operations.map(o =>
                        <Operation key={o.id} op={o} dispatch={this.props.dispatch} />
                    )}
                </div>
            </div>
        );
    }
};
Operations = connect(
    state => ({ operations: state.operations }),
)(Operations);
export { Operations };
