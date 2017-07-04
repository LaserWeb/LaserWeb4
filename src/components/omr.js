import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

export class OmrJog extends React.Component {

    constructor(props){
        super(props)
        this.handleSetPosition = this.handleSetPosition.bind(this)
    }

    handleSetPosition(e) {
        if (this.props.onSetPosition)
            this.props.onSetPosition({x: this.props.settings.toolVideoOMROffsetX || 0, y: this.props.settings.toolVideoOMROffsetY || 0 });
    }

    render()
    {
        return <div className="hr" style={{textAlign:"left"}}>
            <label>OMR</label><Button bsStyle="primary" onClick={this.handleSetPosition}>Set Position</Button>
        </div>
    }
}

OmrJog = connect((state)=>{
    return { settings: state.settings }
})(OmrJog)