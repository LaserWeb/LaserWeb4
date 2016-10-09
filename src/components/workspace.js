import React from 'react'
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import React3 from 'react-three-renderer';
import THREE from 'three';

import SetSize from './SetSize';

class Workspace3d extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.cameraPosition = new THREE.Vector3(0, 0, 5);

        this.state = {
            cubeRotation: new THREE.Euler(),
        };

        this.onAnimate = () => {
            this.setState({
                cubeRotation: new THREE.Euler(
                    this.state.cubeRotation.x + 0.1,
                    this.state.cubeRotation.y + 0.1,
                    0
                ),
            });
        };
    }

    render() {
        console.log(this.props.width, this.props.height)
        return (
            <React3
                mainCamera="camera"
                onAnimate={this.onAnimate}
                width={this.props.width}
                height={this.props.height}
                pixelRatio={window.devicePixelRatio}
                >
                <scene>
                    <perspectiveCamera
                        name="camera"
                        fov={75}
                        aspect={this.props.width / this.props.height}
                        near={0.1}
                        far={1000}
                        position={this.cameraPosition}
                        />
                    <mesh rotation={this.state.cubeRotation} >
                        <boxGeometry width={1} height={1} depth={1} />
                        <meshBasicMaterial color={0x00ff00} />
                    </mesh>
                </scene>
            </React3>
        );
    }
}

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
