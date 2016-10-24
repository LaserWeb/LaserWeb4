import React from 'react'
import { connect } from 'react-redux'
import React3 from 'react-three-renderer';
import THREE from 'three';
import TrackballControls from '../lib/trackball'

import SetSize from './setsize';
import { BufferLine, BufferLineSegments, BufferMesh } from './buffergeometry';
import { Dom3d, Text3d } from './dom3d';

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

function GridText(props) {
    let a = [];
    for (let x = 50; x <= props.width; x += 50)
        a.push(<Text3d key={'x' + x} x={x} y={-5} size={10} style={{ color: 'red' }}>{x}</Text3d>);
    a.push(<Text3d key="x-label" x={props.width + 15} y={0} size={10} style={{ color: 'red' }}>X</Text3d>);
    for (let y = 50; y <= props.height; y += 50)
        a.push(<Text3d key={'y' + y} x={-10} y={y} size={10} style={{ color: 'green' }}>{y}</Text3d>);
    a.push(<Text3d key="y-label" x={0} y={props.height + 15} size={10} style={{ color: 'green' }}>Y</Text3d>);
    return <div>{a}</div>;
}

class WorkspaceContent extends React.Component {
    componentWillMount() {
        this.setCanvas = this.setCanvas.bind(this);
        this.setCamera = this.setCamera.bind(this);
        this.setDom3d = this.setDom3d.bind(this);
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

    setDom3d(dom3d) {
        this.dom3d = dom3d;
    }

    initControls() {
        if (this.canvas && this.camera) {
            if (!this.trackballControls) {
                let controls = this.trackballControls = new TrackballControls(this.camera, this.canvas);
                controls.rotateSpeed = .007;
                controls.zoomSpeed = .01;
                controls.panSpeed = .001;
                controls.dynamicDampingFactor = 0.3;
                controls.addEventListener('change', () => { if (this.dom3d) this.dom3d.forceUpdate(); });
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
                        alpha={true}
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
                <Dom3d className="workspace-content workspace-overlay" camera={this.camera} ref={this.setDom3d}>
                    <GridText {...{ width: this.props.settings.machineWidth, height: this.props.settings.machineHeight }} />
                </Dom3d>
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
