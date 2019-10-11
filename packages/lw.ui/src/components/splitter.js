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
        this.touchStart = this.touchStart.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.touchMove = this.touchMove.bind(this);
        this.touchEnd = this.touchEnd.bind(this);
    }

    mouseDown(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    touchStart(e) {
        e.preventDefault();
        this.touching = true;
        let touch = e.changedTouches[0];
        this.mouseX = touch.clientX;
        this.mouseY = touch.clientY;
    }

    move(clientX, clientY) {
        let delta = this.props.split === 'horizontal' ? clientY - this.mouseY : clientX - this.mouseX;
        this.mouseX = clientX;
        this.mouseY = clientY;
        this.props.dispatch(splitterSetSize(this.props.splitterId, this.size + delta));
        this.forceUpdate();
    }

    mouseMove(e) {
        this.move(e.clientX, e.clientY);
    }

    touchMove(e) {
        e.preventDefault();
        let touch = e.changedTouches[0];
        if (this.touching)
            this.move(touch.clientX, touch.clientY);
    }

    touchEnd(e) {
        this.touching = false;
    }

    render() {
        this.size = this.props.splitters[this.props.splitterId];
        if (this.size === undefined)
            this.size = this.props.initialSize;
        if (this.props.minSize && this.size<this.props.minSize)
            this.size = this.props.minSize
        return (
            <div style={{ ...this.props.style, display: 'flex', flexDirection: this.props.split === 'horizontal' ? 'column' : 'row' }} className={this.props.className}>
                {React.cloneElement(
                    this.props.children,
                    {
                        style: {
                            ...this.props.children.props.style,
                            [this.props.split === 'horizontal' ? 'height' : 'width']: this.size,
                        }
                    }
                )}
                <Capture onMouseDown={this.mouseDown} onTouchStart={this.touchStart} onMouseMove={this.mouseMove} onTouchMove={this.touchMove}
                    onTouchEnd={this.touchEnd} onTouchCancel={this.touchEnd}>
                    <div className={'Resizer ' + this.props.split} style={this.props.resizerStyle} />
                </Capture>
            </div >
        );
    }
}

export default connect(
    state => ({ splitters: state.splitters }),
)(Splitter);
