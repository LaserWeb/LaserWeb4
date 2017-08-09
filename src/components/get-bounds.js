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
import ReactDOM from 'react-dom';

export class GetBounds extends React.Component {
    constructor() {
        super();
        this.state = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
        };
    }

    componentDidMount() {
        this.mounted = true;
        let f = () => {
            if (!this.mounted)
                return;
            let rect = ReactDOM.findDOMNode(this).getBoundingClientRect();
            let newState = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
            };
            if (newState.left !== this.state.left || newState.top !== this.state.top || newState.right !== this.state.right || newState.bottom !== this.state.bottom || newState.width !==this.state.width || newState.height !== this.state.height)
                this.setState(newState);
            requestAnimationFrame(f);
        };
        f();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    getChildContext() {
        return { bounds: this.state };
    }

    render() {
        let {Type, setBoundsProp, children, ...rest} = this.props;
        if (setBoundsProp)
            rest.bounds = this.state;
        return (
            <Type {...rest}>
                {children}
            </Type>
        );
    }
}
GetBounds.childContextTypes = {
    bounds: React.PropTypes.any,
};

export function withGetBounds(Component) {
    class Wrapper extends React.Component {
        render() {
            return (
                <GetBounds {...this.props } Type={Component} setBoundsProp={true}>
                    {this.props.children}
                </GetBounds>
            );
        }
    };
    return Wrapper;
}

export function withStoredBounds(Component) {
    class Wrapper extends React.Component {
        render() {
            return <Component {...this.props} bounds={this.context.bounds} />;
        }
    };
    Wrapper.contextTypes = {
        bounds: React.PropTypes.any,
    };
    return Wrapper;
}
