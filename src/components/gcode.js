import React from 'react'
import { connect } from 'react-redux'

import { setGcode } from '../actions/gcode';

class Gcode extends React.Component {
    render() {
        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <textarea style={{ flexGrow: 2 }} value={this.props.gcode} onChange={this.props.setGcode} />
            </div>
        )
    }
};
Gcode = connect(
    state => ({ gcode: state.gcode }),
    dispatch => ({ setGcode: e => dispatch(setGcode(e.target.value)) })
)(Gcode);

export default Gcode;
