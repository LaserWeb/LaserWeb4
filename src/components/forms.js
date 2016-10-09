import React from 'react';
import { connect } from 'react-redux';

export function NumberField({object, field, description, units, setAttrs, dispatch, ...rest}) {
    return (
        <div className="input-group">
            <span className="input-group-addon">{description}</span>
            <input
                type="number"
                value={object[field]}
                onChange={e => dispatch(setAttrs({ [field]: Number(e.target.value) }, object.id))}
                {...rest}
                />
            <span className="input-group-addon">{units}</span>
        </div>
    );
}
NumberField = connect()(NumberField);
