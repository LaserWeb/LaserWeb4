import React from 'react'
import { connect } from 'react-redux';

import { Input, NumberField, ToggleField } from './forms';
import { setSettingsAttrs } from '../actions/settings';

class Com extends React.Component {
    useGcode() {
        alert(this.props.gcode);
    }

    render() {
        let {settings, dispatch} = this.props;
        return (
            <div>
                <h4>Fancy controls examples</h4>
                <NumberField {...{ object: settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                <ToggleField {... { object: settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock' }} />

                <h4>Basic controls examples</h4>
                Use "Input" for text and number fields. Input uses onChangeValue.
                <br />
                <Input
                    type="number" step="any" style={{ width: 100 }}
                    value={settings.machineWidth}
                    onChangeValue={value => dispatch(setSettingsAttrs({ machineWidth: value }))}
                    />
                <br />
                Use "input" for checkboxes, radio buttons, etc. input uses onChange.
                <br />
                CNC Mode:
                <input type="checkbox"
                    checked={settings.toolCncMode}
                    onChange={e => dispatch(setSettingsAttrs({ toolCncMode: e.target.checked }))}
                    />
                <br />
                <button onClick={e => this.useGcode()}>Use gcode</button>
            </div>
        )
    }
}

Com = connect(
    state => ({ settings: state.settings, gcode: state.gcode })
)(Com);

export default Com
