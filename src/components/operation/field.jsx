import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux';

import useBounds from '../../hooks/use-bounds';
import { setCurrentOperation } from '../../actions/operation';
import { Error } from '.';

export function Field({ op, field, operationsBounds, fillColors, strokeColors, settings, justControl, parent, index, setAttrs, selected }) {
	let { units, wide, style, check, contextMenu, name, error, label } = field;

	let dispatch = useDispatch();
	let [ boundsRef, bounds ] = useBounds();

	let onFocus = useCallback(() => {
		if (!selected) {
			dispatch(setCurrentOperation(op.id));
		}
	}, [ dispatch, selected, op ]);

	let onChangeValue = useCallback((v) => {
		if (name !== v) {
			dispatch(setAttrs({ [name]: v }, op.id));
		}
	}, [ dispatch, name, op, setAttrs ]);

	let onChange = useCallback((e) => {
		onChangeValue(e.target.value);
	}, [ onChangeValue ]);

	if (units === 'mm/min' && settings.toolFeedUnits === 'mm/s') {
		units = settings.toolFeedUnits;
	}

	// FIXME(REFACTOR): Move Error out into its own module
	let errorElement = (check != null && !check(op[name], settings, op, parent, index))
		? <Error bounds={bounds} operationsBounds={operationsBounds} message={(typeof error == 'function') ? error(op[name], settings, op, parent, index) : error} />
		: null;

	let Ctx = contextMenu;
	let labelElement = (Ctx != null)
		? (<Ctx {...{ dispatch, op, field, settings }}><span style={{ borderBottom: "1px dotted darkgray", cursor: "copy" }}>{label}</span></Ctx>)
		: label;

	let Input = field.input;
	let forwardedProps = { op, field, operationsBounds, fillColors, strokeColors, settings, dispatch, style };
	let inputElement = <Input {... forwardedProps} bounds={bounds} onChange={onChange} onChangeValue={onChangeValue} onFocus={onFocus} />;

	if (justControl) {
		return (
			<div ref={boundsRef}>
				{inputElement}
				{errorElement}
			</div>
		);
	} else if (wide) {
		return (
			<tr ref={boundsRef}>
				<td colSpan="3">
					{inputElement}
				</td>
				<td>{units}{errorElement}</td>
			</tr>
		);
	} else {
		return (
			<tr ref={boundsRef}>
				<th width="50%">{labelElement}</th>
					<td>
						{inputElement}
					</td>
				<td>{units}{errorElement}</td>
			</tr>
		);
	}
}
