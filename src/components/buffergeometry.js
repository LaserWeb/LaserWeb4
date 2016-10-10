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

import React from 'react';
import THREE from 'three';

import { triangulatePositions } from '../lib/mesh';

class BufferGeometryWrapper {
    update({position, triangulate}) {
        if (!this.bufferGeometry)
            this.bufferGeometry = new THREE.BufferGeometry();
        if (position && this.position !== position) {
            this.position = position;
            if (Array.isArray(position))
                position = new Float32Array(position);
            this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
        }
        if (triangulate && this.triangulate !== triangulate) {
            this.triangulate = triangulate;
            triangulate = new Float32Array(triangulatePositions(triangulate, -.01));
            this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(triangulate, 3));
        }
    }

    filterProps(props) {
        props = {...props };
        delete props.position;
        delete props.triangulate;
        return props;
    }
}

// Wraps line and fills with BufferGeometry
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

// Wraps lineSegments and fills with BufferGeometry
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

// Wraps mesh and fills with BufferGeometry
export class BufferMesh extends React.Component {
    constructor() {
        super();
        this.geomWrapper = new BufferGeometryWrapper();
    }

    render() {
        this.geomWrapper.update(this.props);
        return (
            <mesh {...{
                        ...this.geomWrapper.filterProps(this.props),
                ref: object => { if (object) object.geometry = this.geomWrapper.bufferGeometry; }
            }}>
                {this.props.children}
            </mesh>
        );
    }
}
