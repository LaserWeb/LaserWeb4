import React from 'react'
import { connect } from 'react-redux'
import React3 from 'react-three-renderer';
import THREE from 'three';
import TrackballControls from '../lib/trackball'

import SetSize from './setsize';
import { BufferLine, BufferLineSegments, BufferMesh } from './buffergeometry';

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

class WorkspaceContent extends React.Component {
    componentWillMount() {
        this.setCanvas = this.setCanvas.bind(this);
        this.setCamera = this.setCamera.bind(this);
        this.onAnimate = this.onAnimate.bind(this);
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.initControls();
    }

    setCamera(camera) {
        this.camera = camera;
        this.initControls();
    }

    initControls() {
        if (this.canvas && this.camera) {
            if (!this.trackballControls) {
                let controls = this.trackballControls = new TrackballControls(this.camera, this.canvas);
                controls.rotateSpeed = .02;
                controls.zoomSpeed = .01;
                controls.panSpeed = .005;
                controls.dynamicDampingFactor = 0.3;
            }
        } else if (this.trackballControls) {
            this.trackballControls.dispose();
            this.trackballControls = null;
        }
    }

    onAnimate() {
        if (this.trackballControls)
            this.trackballControls.update();
    }

    render() {
        let content = [];

        let f = document => {
            if (document.type === 'path') {
                content.push(
                    <BufferMesh key={document.id + '/mesh'} triangulate={document.positions}>
                        <meshBasicMaterial color={0x00ffff} />
                    </BufferMesh>
                );
                for (let i = 0; i < document.positions.length; ++i) {
                    content.push(
                        <BufferLine key={document.id + '/outline/' + i} position={document.positions[i]}>
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
            <div className="workspace-content">
                <div className="workspace-content">
                    <React3
                        mainCamera="camera"
                        canvasRef={this.setCanvas}
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
                                ref={this.setCamera}
                                />
                            <Grid {...{ width: this.props.settings.machineWidth, height: this.props.settings.machineHeight }} />
                            {content}
                        </scene>
                    </React3>
                </div>
                <div className="workspace-content workspace-overlay">
                    Overlay info...
                </div>
            </div>
        );
    }
}
WorkspaceContent = connect(
    state => ({ settings: state.settings, documents: state.documents })
)(WorkspaceContent);

export default class Workspace extends React.Component {
    render() {
        this.needRedraw = true;
        return (
            <div id="workspace" className="full-height">
                <SetSize id="workspace-top">
                    <WorkspaceContent />
                </SetSize>
                <div id="workspace-controls">
                    <p />
                    <b>Stuff goes here...</b>
                    <p />
                </div>
            </div>
        )
    }
}
