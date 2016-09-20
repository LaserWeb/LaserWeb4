import React from 'react';
import uuid from 'node-uuid';
import {connect} from 'react-redux';

// TODO: vscode's syntax highlighter and autoformatter crap out in some 
//       cases; until this is fixed:
//          * In some spots I have to use function instead of =>
//          * In some spots I have to use Object.assign() instead of object spread
//          * I can't use @connect(...) notation; instead I use
//            y = connect(...)(y)

////////////////////////////////////////////////////////////////////////////////
// Action creator creators
//
// TODO: These should be moved to a separate module
// TODO: There's probably an existing library which does this
////////////////////////////////////////////////////////////////////////////////

export const setAttrs = (objectType) => {
    let type = 'SET_' + objectType.toUpperCase() + '_ATTRS';
    return (id, attrs) => ({ type, id, attrs });
};

export const add = (objectType) => {
    let type = 'ADD_' + objectType.toUpperCase();
    return (attrs) => ({ type, id: uuid.v4(), attrs });
};

export const remove = (objectType) => {
    let type = 'REMOVE_' + objectType.toUpperCase();
    return (id) => ({ type, id });
};

////////////////////////////////////////////////////////////////////////////////
// Reducer creators
//
// TODO: These should be moved to a separate module
// TODO: There's probably an existing library which does this
////////////////////////////////////////////////////////////////////////////////

export const reduceObjectArray = (objectType, defaultValue) => {
    let add = 'ADD_' + objectType.toUpperCase();
    let remove = 'REMOVE_' + objectType.toUpperCase();
    let setAttrs = 'SET_' + objectType.toUpperCase() + '_ATTRS';
    return (state = [], action) => {
        switch (action.type) {
            case add:
                return [
                    ...state,
                    Object.assign({}, defaultValue, action.attrs, { id: action.id })
                ];
            case remove:
                return state.filter(o => o.id !== action.id);
            case setAttrs:
                return state.map(o => {
                    if (o.id === action.id)
                        return Object.assign({}, o, action.attrs);
                    else
                        return o;
                });
            default:
                return state;
        }
    };
};

////////////////////////////////////////////////////////////////////////////////
// cam actions and reducers
////////////////////////////////////////////////////////////////////////////////

const setOperationAttrs = setAttrs('operation');
const addOperation = add('operation');
const removeOperation = remove('operation');

const operations = reduceObjectArray('operation', {
    camToolDia: 6.35,
    camZClearance: 10,
    camDragOffset: 0.1,
    camVDia: 10,
    camVHeight: 10,
    camVAngle: 90,
    camLaserPower: 100,
    camLaserDiameter: 0.1,
});

export const cam = (state = {}, action) => {
    return {
        operations: operations(state.operations, action),
    };
}

////////////////////////////////////////////////////////////////////////////////
// cam components
////////////////////////////////////////////////////////////////////////////////

function NumberField({object, field, description, units, setAttrs, dispatch, ...rest}) {
    return (
        <div className="input-group">
            <span className="input-group-addon">{description}</span>
            <input
                type="number"
                value={object[field]}
                onChange={e => dispatch(setAttrs(object.id, { [field]: Number(e.target.value) })) }
                {...rest}
                />
            <span className="input-group-addon">{units}</span>
        </div>
    );
}
NumberField = connect()(NumberField);

function Operation({op, dispatch}) {
    return (
        <div>
            <div className="form-group">
                <label className="control-label">Tool Options
                    <button onClick={e => dispatch(removeOperation(op.id)) }>Remove Operation</button>
                </label>
                <NumberField field="camToolDia"       units="mm"  description="Endmill Diameter"          step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camZClearance"    units="mm"  description="Z Safe Height"             step="any" min="1"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camDragOffset"    units="mm"  description="Drag Knife: Center Offset" step="0.1" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVDia"          units="mm"  description="V Bit: Diameter"           step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVHeight"       units="mm"  description="V Bit: Height"             step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVAngle"        units="deg" description="V Bit: V Angle"            step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camLaserPower"    units="%"   description="Laser: Power"              step="any" min="1"   max="100" object={op} setAttrs={setOperationAttrs} className="form-control"/>
                <NumberField field="camLaserDiameter" units="mm"  description="Laser: Diameter"           step="0.1" min="0.1" max="5"   object={op} setAttrs={setOperationAttrs} className="form-control"/>

            </div>
        </div>
    );
}
Operation = connect()(Operation);

export function CamPane({cam, dispatch}) {
    return (
        <div>
            <button onClick={e => dispatch(addOperation()) }>Add Operation</button>
            {cam.operations.map(op => <Operation key={op.id} op={op}/>) }
        </div>);
}
CamPane = connect()(CamPane);

////////////////////////////////////////////////////////////////////////////////
// Hook up to rest of system; this will probably go away when entire system is
// react+redux.
////////////////////////////////////////////////////////////////////////////////

export function initCam(lw, cb) {
    lw.add_module('layout.panes.cam', {
        autoload: true,
        version: '0.0.1',
        title: 'CAM',
        icon: 'pencil-square-o',
        extends: ['layout.pane'],
        init: function () {
            this.add_dock();
            this.add_pane();
            cb(this.$.pane.get(0));
        }
    });
}
