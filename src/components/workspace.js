/**
 * Workspace module.
 * - Handle workspace modules.
 * @module
 */

import React from 'react'
import { connect } from 'react-redux'
import * as THREE from 'three';

/**
 * Workspace component.
 * - Handle workspace modules.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class Workspace extends React.Component {
    setCanvas(canvas) {
        if (!canvas) {
            this.haveCanvas = false;
            return;
        }
        this.haveCanvas = true;

        if (canvas !== this.canvas) {
            this.canvas = canvas;
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 1, 10000);
            this.camera.position.z = 1000;
            let geometry = new THREE.BoxGeometry(200, 200, 200);
            let material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
            this.renderer = new THREE.WebGLRenderer({ canvas });
        }

        if (!this.animateActive) {
            let animate = () => {
                if (!this.haveCanvas) {
                    this.animateActive = false;
                    return;
                }
                requestAnimationFrame(animate);

                if (this.clientWidth !== this.canvas.clientWidth || this.clientHeight !== this.canvas.clientHeight) {
                    this.clientWidth = this.canvas.clientWidth;
                    this.clientHeight = this.canvas.clientHeight;
                    this.renderer.setSize(this.clientWidth, this.clientHeight, false);
                    this.camera.aspect = this.clientWidth / this.clientHeight;
                    this.camera.updateProjectionMatrix();
                    this.needRedraw = true;
                }
                if (this.needRedraw) {
                    this.mesh.rotation.x += 0.1;
                    this.mesh.rotation.y += 0.2;
                    this.renderer.render(this.scene, this.camera);
                    this.needRedraw = false;
                }
            };
            this.animateActive = true;
            animate();
        }
    }

    render() {
        this.needRedraw = true;
        return (
            <div id="workspace" className="full-height">
                <div className="canvas-div">
                    <canvas ref={canvas => this.setCanvas(canvas)} />
                </div>
                <div className="workspace-controls">
                    <p />
                    <b>Stuff goes here...</b>
                    <p />
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        fullWidth: !state.panes.visible
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

// Exports
export default connect(mapStateToProps, mapDispatchToProps)(Workspace)
