import React from 'react'
import { connect } from 'react-redux'

class Gcode extends React.Component {
    render() {
        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <textarea style={{ flexGrow: 2 }} value={this.props.gcode} />
            </div>
        )
    }
};
Gcode = connect(
    state => ({ gcode: state.gcode })
)(Gcode);

export default Gcode;
