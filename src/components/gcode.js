import React from 'react'
import { connect } from 'react-redux'

import { setGcode } from '../actions/gcode';
import { sendAsFile } from '../lib/helpers';

class Gcode extends React.Component {
    render() {
        let textArea;
        // textArea = <textarea style={{ flexGrow: 2 }} value={this.props.gcode} onChange={this.props.setGcode} />;
        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <button onClick={this.props.saveGcode}>Save GCode</button>
                </div>
                {textArea}
            </div>
        )
    }
};
Gcode = connect(
    state => ({
        gcode: state.gcode,
        saveGcode: () => sendAsFile('gcode.gcode', state.gcode),
    }),
    dispatch => ({ setGcode: e => dispatch(setGcode(e.target.value)) })
)(Gcode);

export default Gcode;
