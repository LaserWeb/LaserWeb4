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

const eventNames = [
    'onClick', 'onContextMenu', 'onDoubleClick', 'onDrag',
    'onDragEnd', 'onDragEnter', 'onDragExit',
    'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop',
    'onMouseMove', 'onMouseOut', 'onMouseOver', 'onMouseUp',
];

export class AllowCapture extends React.Component {
    componentWillMount() {
        this.events = {};
        for (let n of eventNames) {
            this.events[n + 'Capture'] = e => {
                if (!this.capture)
                    return;
                e.preventDefault();
                e.stopPropagation();
                if (this.capture.props[n])
                    this.capture.props[n](e);
            };
        }
        this.events.onMouseDownCapture = e => {
            if (!this.capture)
                return;
            e.preventDefault();
            e.stopPropagation();
            if (this.capture.props.onMouseDown)
                this.capture.props.onMouseDown(e);
        }
        this.events.onMouseUpCapture = e => {
            if (!this.capture)
                return;
            e.preventDefault();
            e.stopPropagation();
            if (this.capture.props.onMouseUp)
                this.capture.props.onMouseUp(e);
            if (!e.buttons)
                this.capture = null;
        }
        this.events.onMouseLeave = e => {
            if (!this.capture)
                return;
            this.capture = null;
        }
    }

    getChildContext() {
        return { allowCapture: this };
    }

    render() {
        return (
            <div {...this.events} style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
};
AllowCapture.childContextTypes = {
    allowCapture: React.PropTypes.any,
};

export default class Capture extends React.Component {
    componentWillMount() {
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    onMouseDown(e) {
        this.context.allowCapture.capture = this;
        this.context.allowCapture.events.onMouseDownCapture(e);
    }

    render() {
        return (
            <div onMouseDown={this.onMouseDown} onContextMenu={this.props.onContextMenu} onWheel={this.props.onWheel}>
                {this.props.children}
            </div>
        );
    }
};
Capture.contextTypes = {
    allowCapture: React.PropTypes.any,
};
