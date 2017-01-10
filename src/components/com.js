import React from 'react'
import { connect } from 'react-redux';

import { Input, NumberField, ToggleField } from './forms';
import { setSettingsAttrs } from '../actions/settings';

class Com extends React.Component {
    render() {
        return (
            <div>
                <h4>Fancy controls examples</h4>
                <NumberField {...{ object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                <ToggleField {... { object: this.props.settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock' }} />

                <h4>Basic controls examples</h4>
                Use "Input" for text and number fields. Input uses onChangeValue.
                <br />
                <Input
                    type="number" step="any" style={{ width: 100 }}
                    value={this.props.settings.machineWidth}
                    onChangeValue={value => this.props.dispatch(setSettingsAttrs({ machineWidth: value }))}
                    />
                <br />
                Use "input" for checkboxes, radio buttons, etc. input uses onChange.
                <br />
                CNC Mode:
                <input type="checkbox"
                    checked={this.props.settings.toolCncMode}
                    onChange={e => this.props.dispatch(setSettingsAttrs({ toolCncMode: e.target.checked }))}
                    />
            </div>
        )
    }
}

Com = connect(
    state => ({ settings: state.settings })
)(Com);

export default Com
