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
        if (canvas === this.canvas)
            return;
        this.canvas = canvas;
        if (!this.canvas)
            return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 1000;
        let geometry = new THREE.BoxGeometry(200, 200, 200);
        let material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        this.renderer = new THREE.WebGLRenderer({ canvas });

        let animate = () => {
            if (!this.canvas)
                return;
            let w = Math.floor(this.canvas.clientWidth * window.devicePixelRatio);
            let h = Math.floor(this.canvas.clientHeight * window.devicePixelRatio);
            if (this.canvas.width != w || this.canvas.height != h) {
                this.canvas.width = w;
                this.canvas.height = h;
                this.needRedraw = true;
            }
            if (this.needRedraw) {
                this.mesh.rotation.x += 0.1;
                this.mesh.rotation.y += 0.2;
                this.renderer.render(this.scene, this.camera);
                this.needRedraw = false;
            }
            requestAnimationFrame(animate);
        };
        animate();
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
