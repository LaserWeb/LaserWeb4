// Copyright 2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from 'react';
import { connect } from 'react-redux'

import Capture from './capture';
import { splitterSetSize } from '../actions/splitters'

class Splitter extends React.Component {
    componentWillMount() {
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
    }

    mouseDown(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    mouseMove(e) {
        let delta = this.props.split === 'horizontal' ? e.clientY - this.mouseY : e.clientX - this.mouseX;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.props.dispatch(splitterSetSize(this.props.splitterId, this.size + delta));
        this.forceUpdate();
    }

    render() {
        this.size = this.props.splitters[this.props.splitterId];
        if (this.size === undefined)
            this.size = this.props.initialSize;
        return (
            <div style={{...this.props.style, display: 'flex', flexDirection: this.props.split === 'horizontal' ? 'column' : 'row' }} className={this.props.className}>
                {React.cloneElement(
                    this.props.children,
                    { style: {
                    ...this.props.children.props.style,
                    [this.props.split === 'horizontal' ? 'height' : 'width']: this.size,
                    }}
                )}
                <Capture onMouseDown={this.mouseDown} onMouseMove={this.mouseMove}>
                    <div className={'Resizer ' + this.props.split} style={this.props.resizerStyle} />
                </Capture>
            </div >
        );
    }
}

export default connect(
    state => ({ splitters: state.splitters }),
)(Splitter);
