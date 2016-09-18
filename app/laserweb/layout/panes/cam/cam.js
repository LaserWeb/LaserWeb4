import React from 'react';

export function initCam(lw, cb) {
    /**
    * LaserWeb cam module.
    *
    * Description...
    */
    lw.add_module('layout.panes.cam', {

        // Autoload the module ?
        autoload: true,

        // Module version
        version: '0.0.1',

        // Module title
        title: 'CAM',

        // Module icon
        icon: 'pencil-square-o',

        // Extends
        extends: ['layout.pane'],

        init: function () {
            // Add the dock entry
            this.add_dock();

            // Add the pane
            this.add_pane();

            // Notify index.js of the element so it can hot reload
            cb(this.$.pane.get(0));
        }
    });
}

// state:   A normal js object that contains field values
// changed: This callback is called whenever the user changes field value
// field:   Name of field in state
function NumberField({state, changed, field, defaultValue, description, units, ...rest}) {
    if (typeof (state[field]) !== 'number')
        state[field] = Number(defaultValue);
    return (
        <div className="input-group">
            <span className="input-group-addon">{description}</span>
            <input
                type="number"
                value={state[field]} {...rest}
                onChange={e => { state[field] = Number(e.target.value); changed() } }
                />
            <span className="input-group-addon">{units}</span>
        </div>
    );
}

// state:       A normal js object that contains field values. This function renders the
//              values in state and modifies it when the user changes field values. 
//              Eg: {camDragOffset: 0.1, camLaserDiameter: 0.1, camLaserPower: 100, ...}
//
// changed:     This callback is called whenever the user changes field values     
function Operation({state, changed}) {
    console.log(state);
    return (
        <div>
            <div className="form-group">
                <label className="control-label">Tool Options</label>
                <NumberField field="camToolDia"       units="mm"  defaultValue="6.35" description="Endmill Diameter"            step="any" min="0"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camZClearance"    units="mm"  defaultValue="10"   description="Z Safe Height"               step="any" min="1"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camDragOffset"    units="mm"  defaultValue="0.1"  description="Drag Knife: Center Offset"   step="0.1" min="0"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camVDia"          units="mm"  defaultValue="10"   description="V Bit: Diameter"             step="any" min="0"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camVHeight"       units="mm"  defaultValue="10"   description="V Bit: Height"               step="any" min="0"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camVAngle"        units="deg" defaultValue="90"   description="V Bit: V Angle"              step="any" min="0"             state={state} changed={changed} className="form-control input-sm"/>
                <NumberField field="camLaserPower"    units="%"   defaultValue="100"  description="Laser: Power"                step="any" min="1"   max="100" state={state} changed={changed} className="form-control"/>
                <NumberField field="camLaserDiameter" units="mm"  defaultValue="0.1"  description="Laser: Diameter"             step="0.1" min="0.1" max="5"   state={state} changed={changed} className="form-control"/>
            </div>
            <button type="button" className="btn btn-lg btn-success" data-dismiss="modal">Preview Toolpath </button>
        </div>
    );
}

export function CamPane({state, changed}) {
    return (<Operation state={state} changed={changed}/>);
}
