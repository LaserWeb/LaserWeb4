import React from 'react'
import THREE from 'three';

class BufferGeometryWrapper {
    update({position}) {
        if (!this.bufferGeometry)
            this.bufferGeometry = new THREE.BufferGeometry();
        if (position && this.position !== position) {
            this.position = position;
            this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
        }
    }

    filterProps(props) {
        props = {...props };
        delete props.position;
        return props;
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
