// Copyright 2014-2016 Todd Fleming
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
import THREE from 'three';

class BufferGeometryWrapper {
    update({position}) {
        if (!this.bufferGeometry)
            this.bufferGeometry = new THREE.BufferGeometry();
        if (position && this.position !== position) {
            this.position = position;
            if (Array.isArray(position))
                position = new Float32Array(position);
            this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
        }
    }

    filterProps(props) {
        props = {...props };
        delete props.position;
        return props;
    }
}

// Wraps line and fills with BufferGeometry, since that is currently missing from react-three-renderer.
export class BufferLine extends React.Component {
    constructor() {
        super();
        this.geomWrapper = new BufferGeometryWrapper();
    }

    render() {
        this.geomWrapper.update(this.props);
        return (
            <line {...{
                    ...this.geomWrapper.filterProps(this.props),
                ref: object => { if (object) object.geometry = this.geomWrapper.bufferGeometry; }
            }}>
                {this.props.children}
            </line>
        );
    }
}

// Wraps lineSegments and fills with BufferGeometry, since that is currently missing from react-three-renderer.
export class BufferLineSegments extends React.Component {
    constructor() {
        super();
        this.geomWrapper = new BufferGeometryWrapper();
    }

    render() {
        this.geomWrapper.update(this.props);
        return (
            <lineSegments {...{
                    ...this.geomWrapper.filterProps(this.props),
                ref: object => { if (object) object.geometry = this.geomWrapper.bufferGeometry; }
            }}>
                {this.props.children}
            </lineSegments>
        );
    }
}
