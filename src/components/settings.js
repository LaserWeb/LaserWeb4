import React from 'react';
import { connect } from 'react-redux';

import { NumberField } from './forms';
import { setSettingsAttrs } from '../actions/settings';

export default class Settings extends React.Component {
    render() {
        return (
            <div>
                <NumberField {...{ object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                <NumberField {...{ object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Machine Height', units: 'mm' }} />
            </div>
        )
    }
}
Settings = connect(
    state => ({ settings: state.settings })
)(Settings);
