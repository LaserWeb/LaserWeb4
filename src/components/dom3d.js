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

// Includes code from CSS3DRenderer.js:
//      Author mrdoob / http://mrdoob.com/
//      Based on http://www.emagix.net/academic/mscs-project/item/camera-sync-with-css3-and-webgl-threejs

import React from 'react'
import ReactDOM from 'react-dom';
import THREE from 'three';

function epsilon(value) {
    return Math.abs(value) < Number.EPSILON ? 0 : value;
};

function getCameraCSSMatrix(matrix) {
    var elements = matrix.elements;
    return 'matrix3d(' +
        epsilon(elements[0]) + ',' +
        epsilon(- elements[1]) + ',' +
        epsilon(elements[2]) + ',' +
        epsilon(elements[3]) + ',' +
        epsilon(elements[4]) + ',' +
        epsilon(-elements[5]) + ',' +
        epsilon(elements[6]) + ',' +
        epsilon(elements[7]) + ',' +
        epsilon(elements[8]) + ',' +
        epsilon(-elements[9]) + ',' +
        epsilon(elements[10]) + ',' +
        epsilon(elements[11]) + ',' +
        epsilon(elements[12] / window.devicePixelRatio) + ',' +
        epsilon(- elements[13] / window.devicePixelRatio) + ',' +
        epsilon(elements[14]) + ',' +
        epsilon(elements[15]) +
        ')';
};

export class Dom3d extends React.Component {
    componentWillUpdate() {
        if (!this.props.camera)
            return;
        let camera = this.props.camera;
        let node = ReactDOM.findDOMNode(this);
        this.width = node.clientWidth;
        this.height = node.clientHeight;
        this.fov = 0.5 / Math.tan(THREE.Math.degToRad(camera.getEffectiveFOV() * 0.5)) * node.clientHeight;
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        this.transform = "translate3d(0,0," + this.fov + "px)" + getCameraCSSMatrix(camera.matrixWorldInverse) +
            " translate3d(" + node.clientWidth / 2 + "px," + node.clientHeight / 2 + "px, 0)";
    }

    render() {
        return (
            <div className={this.props.className} style={{
                overflow: 'hidden',
                transformStyle: 'preserve-3d',
                perspective: this.fov
            }}>
                <div style={{
                    position: 'absolute',
                    width: this.width,
                    height: this.height,
                    transformStyle: 'preserve-3d',
                    transform: this.transform,
                }}>
                    {this.props.children}
                </div>
            </div >
        );
    }
}

export function Text3d(props) {
    return (
        <div style={{
            position: 'absolute',
            transform: 'translate3d(' + (props.x / window.devicePixelRatio) + 'px,' + (props.y / window.devicePixelRatio) + 'px,0) translate3d(-50%,-50%,0) scale(.1,-.1)',
        }}>
            <div style={Object.assign({}, props.style, {
                left: 0,
                top: 0,
                fontSize: props.size * 10 / window.devicePixelRatio,
            })}>
                {props.children}
            </div>
        </div >
    );
}
