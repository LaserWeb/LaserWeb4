import React from 'react'
import { connect } from 'react-redux';
import Select from 'react-select';
import Toggle from 'react-toggle';

import { Input } from '../forms';
import { getDescendantProp } from '../../lib/helpers';
import { Button } from 'react-bootstrap';
import { operationLatheTurnSetAttrs } from '../../actions/operation';
import { Field } from './field';

export function StringInput(props) {
	// eslint-disable-next-line no-unused-vars
	let { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest } = props;
	let value = op[field.name];
	return <Input value={value !== undefined ? value : ''}  {...rest } />;
}

export function NumberInput(props) {
	// eslint-disable-next-line no-unused-vars
	let { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest } = props;
	return <Input type='number' step='any' value={op[field.name]}   {...rest } />;
}

export function EnumInput(opts, _def) {
	if (Array.isArray(opts)) {
		opts = Object.assign(...opts.map(i => ({ [i]: i })))
	}

	// eslint-disable-next-line no-unused-vars
	return function ({ op, field, onChangeValue, operationsBounds, fillColors, strokeColors, settings, dispatch, ...rest }) {
		return <select value={op[field.name]}  {...rest} >
			{Object.entries(opts).map((e, i) => (<option key={i} value={e[0]}>{e[1]}</option>))}
		</select>
	}
}

export const DirectionInput = EnumInput(['Conventional', 'Climb']);
export const GrayscaleInput = EnumInput(['none', 'average', 'luma', 'luma-601', 'luma-709', 'luma-240', 'desaturation', 'decomposition-min', 'decomposition-max', 'red-chanel', 'green-chanel', 'blue-chanel']);

// eslint-disable-next-line no-unused-vars
export function ToggleInput({ op, field, onChangeValue, operationsBounds, fillColors, strokeColors, settings, className = "scale75", dispatch, ...rest }) {
	return <Toggle id={"toggle_" + op.id + "_" + field} defaultChecked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} className={className} />
}

export function TagInput(statekey, opts = { multi: true, simpleValue: true, delimiter: ',', clearable: true }, connector) {
	if (!connector) {
		connector = (state) => { return { options: Object.entries(getDescendantProp(state, statekey)).map(i => { return { label: i[1].label, value: i[0] } }) } }
	}

	// FIXME(REFACTOR)
	return connect(connector)(class extends React.Component {
		render() {
			return <Select options={this.props.options} value={this.props.op[this.props.field.name]} onChange={e => this.props.onChangeValue(e)} {...{ ...opts }} />
		}
	});

}

export function ButtonInput(args) {
	return <Button onClick={e => args.field.onClick(e, args)} bsSize="xsmall" bsStyle="info" >{args.field.buttonLabel}</Button>;
}

export function TableInput({ op, field, operationsBounds, fillColors, strokeColors, settings, dispatch }) {
	let { name, fields, remove } = field;
	let array = op[name];
	if (!array.length) {
		return null;
	}
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
				<button className="btn btn-default btn-xs" onClick={() => dispatch(remove(item.id))}>
					<i className="fa fa-trash"></i>
				</button>
			</td>
		</tr>)}
	</tbody></table></div>;
}

export function ColorBox(v) {
	let rgb = 'rgb(' + v.color[0] * 255 + ',' + v.color[1] * 255 + ',' + v.color[2] * 255 + ')';
	return (
		<span style={{ backgroundColor: rgb, width: 40, display: 'inline-block' }}>&nbsp;</span>
	);
}

// FIXME(REFACTOR)
export class FilterInput extends React.Component {
	UNSAFE_componentWillMount() {
		this.onChange = this.onChange.bind(this);
	}

	onChange(v) {
		if (v) {
			this.props.onChangeValue(JSON.parse(v.value));
		} else {
			this.props.onChangeValue(null);
		}
	}

	render() {
		// eslint-disable-next-line no-unused-vars
		let { op, field, onChange, onChangeValue, operationsBounds, fillColors, strokeColors, settings, ...rest } = this.props;
		let raw = op[field.name];
		let colors = field.name === 'filterFillColor' ? fillColors : strokeColors;
		let value;
		if (raw) {
			value = JSON.stringify(raw);
		} else {
			value = null;
		}
		return (
			<Select
				value={value} options={colors} onChange={this.onChange} searchable={false}
				optionRenderer={ColorBox} valueRenderer={ColorBox} {...rest} />
		);
	}
}
