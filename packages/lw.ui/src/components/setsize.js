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

import React from 'react'
import ReactDOM from 'react-dom';
import omit from 'object.omit';

export default class SetSize extends React.Component {
    constructor() {
        super();
        this.clientWidth = 1;
        this.clientHeight = 1;
    }

    componentDidMount() {
        this.mounted = true;
        let f = () => {
            if (!this.mounted)
                return;
            let node = ReactDOM.findDOMNode(this);
            if (this.props.selector && node.querySelector(this.props.selector))
                node = node.querySelector(this.props.selector)
            if (this.clientWidth !== node.clientWidth || this.clientHeight !== node.clientHeight) {
                this.clientWidth = node.clientWidth;
                this.clientHeight = node.clientHeight;
                this.setState({});
            }
            requestAnimationFrame(f);
        };
        f();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        return (
            <div {...{ ...omit(this.props,'selector') }}>
                {React.cloneElement(this.props.children, { width: this.clientWidth, height: this.clientHeight })}
            </div>
        );
    }
}
