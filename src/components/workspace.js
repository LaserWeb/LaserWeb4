import React from 'react'
import { connect } from 'react-redux'
import React3 from 'react-three-renderer';
import THREE from 'three';

import SetSize from './setsize';
import { BufferLine, BufferLineSegments } from './buffergeometry';

class Grid extends React.Component {
    render() {
        if (!this.position || this.width !== this.props.width || this.height !== this.props.height) {
            this.width = this.props.width;
            this.height = this.props.height;
            let a = [];
            for (let x = 10; x < this.width; x += 10)
                a.push(x, 0, 0, x, this.height, 0);
            a.push(this.width, 0, 0, this.width, this.height, 0);
            for (let y = 10; y < this.height; y += 10)
                a.push(0, y, 0, this.width, y, 0);
            a.push(0, this.height, 0, this.width, this.height, 0);
            this.position = new Float32Array(a);
        }

        return (
            <group>
                <BufferLineSegments position={this.position}>
                    <lineBasicMaterial color={0x000000} />
                </BufferLineSegments>
                <line>
                    <lineBasicMaterial color={0xff0000} />
                    <geometry vertices={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(this.props.width + 5, 0, 0)]} />
                </line>
                <line>
                    <lineBasicMaterial color={0x00ff00} />
                    <geometry vertices={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, this.props.height + 5, 0)]} />
                </line>
            </group>
        );
    }
};

class Workspace3d extends React.Component {
    render() {
        let content = [];

        let f = document => {
            if (document.type === 'path') {
                for (let i = 0; i < document.positions.length; ++i) {
                    let position = document.positions[i];
                    content.push(
                        <BufferLine key={document.id + '/' + i} position={position}>
                            <lineBasicMaterial color={0x000000} />
                        </BufferLine>
                    );
                }
            } else {
                for (let c of document.children)
                    f(this.props.documents.find(d => d.id === c));

            }
        }
        for (let d of this.props.documents)
            if (d.type === 'document')
                f(d);

        return (
            <React3
                mainCamera="camera"
                onAnimate={this.onAnimate}
                width={this.props.width}
                height={this.props.height}
                pixelRatio={window.devicePixelRatio}
                clearColor={0x00ffffff}
                >
                <scene>
                    <perspectiveCamera
                        name="camera"
                        fov={75}
                        aspect={this.props.width / this.props.height}
                        near={0.1}
                        far={1000}
                        position={new THREE.Vector3(100, 100, 300)}
                        />
                    <Grid {...{ width: this.props.settings.machineWidth, height: this.props.settings.machineHeight }} />
                    {content}
                </scene>
            </React3>
        );
    }
}
Workspace3d = connect(
    state => ({ settings: state.settings, documents: state.documents })
)(Workspace3d);

export default class Workspace extends React.Component {
    render() {
        this.needRedraw = true;
        return (
            <div id="workspace" className="full-height">
                <SetSize className="canvas-div">
                    <Workspace3d />
                </SetSize>
                <div className="workspace-controls">
                    <p />
                    <b>Stuff goes here...</b>
                    <p />
                </div>
            </div>
        )
    }
}
