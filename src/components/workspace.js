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

import { mat4, vec3, vec4 } from 'gl-matrix';
import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom';

import { resetCamera, setCameraAttrs } from '../actions/camera'
import Capture from './capture';
import { withDocumentCache } from './document-cache'
import { Dom3d, Text3d } from './dom3d';
import DrawCommands from '../draw-commands'
import { triangulatePositions } from '../lib/mesh';
import SetSize from './setsize';

function perspectiveCamera({viewportWidth, viewportHeight, fovy, near, far, eye, center, up}) {
    let perspective = mat4.perspective([], fovy, viewportWidth / viewportHeight, near, far);
    let world = mat4.lookAt([], eye, center, up);
    return { fovy, perspective, world };
}

class Grid {
    draw(drawCommands, {width, height}) {
        if (!this.position || this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            let a = [];
            a.push(0, 0, 0, this.width, 0, 0);
            a.push(0, 0, 0, 0, this.height, 0);
            for (let x = 10; x < this.width; x += 10)
                a.push(x, 0, 0, x, this.height, 0);
            a.push(this.width, 0, 0, this.width, this.height, 0);
            for (let y = 10; y < this.height; y += 10)
                a.push(0, y, 0, this.width, y, 0);
            a.push(0, this.height, 0, this.width, this.height, 0);
            if (this.position)
                this.position.destroy();
            this.position = drawCommands.regl.buffer(new Float32Array(a));
            this.count = a.length / 3;
        }
        drawCommands.simple({ position: this.position, offset: 4, count: this.count - 4, color: [0, 0, 0, 1], primitive: 'lines' });
        drawCommands.simple({ position: this.position, offset: 0, count: 2, color: [1, 0, 0, 1], primitive: 'lines' });
        drawCommands.simple({ position: this.position, offset: 2, count: 2, color: [0, 1, 0, 1], primitive: 'lines' });
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
        this.grid = new Grid();
        this.setCanvas = this.setCanvas.bind(this);
        this.documentCache = [];
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.contextMenu = this.contextMenu.bind(this);
        this.wheel = this.wheel.bind(this);
    }

    setCanvas(canvas) {
        if (this.canvas === canvas)
            return;
        this.canvas = canvas;
        if (!canvas) {
            if (this.regl) {
                this.regl.destroy();
                this.regl = null;
            }
            return;
        }

        this.regl = require('regl')({
            canvas: ReactDOM.findDOMNode(canvas)
        });

        let drawCommands = new DrawCommands(this.regl);

        this.regl.frame(() => {
            this.regl.clear({
                color: [1, 1, 1, 1],
                depth: 1
            })

            drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });

                for (let document of this.props.documents) {
                    let cache = this.props.documentCacheHolder.cache.get(document.id);
                    if (!cache)
                        continue;
                    if (document.type === 'path') {
                        if (!cache.positions || cache.positions !== document.positions) {
                            cache.positions = document.positions;
                            cache.triangles = new Float32Array(triangulatePositions(document.positions, 0));
                            cache.outlines = [];
                            for (let p of document.positions)
                                cache.outlines.push(new Float32Array(p));
                        }
                        drawCommands.noDepth(() => {
                            drawCommands.simple({
                                position: cache.triangles,
                                color: document.selected ? [.2, .2, 1, 1] : [0, 1, 1, 1],
                                primitive: 'triangles',
                                offset: 0,
                                count: cache.triangles.length / 3,
                            });
                            for (let o of cache.outlines)
                                drawCommands.simple({
                                    position: o,
                                    color: [0, 0, 0, 1],
                                    primitive: 'line strip',
                                    offset: 0,
                                    count: o.length / 3,
                                });
                        });
                    }
                }
            });
        })
    }

    componentWillReceiveProps(nextProps) {
        this.camera =
            perspectiveCamera({
                viewportWidth: nextProps.width,
                viewportHeight: nextProps.height,
                fovy: nextProps.camera.fovy,
                near: .1,
                far: 2000,
                eye: nextProps.camera.eye,
                center: nextProps.camera.center,
                up: nextProps.camera.up,
            });
    }

    mouseDown(e) {
        this.mouseX = e.screenX;
        this.mouseY = e.screenY;
    }

    mouseMove(e) {
        let dx = e.screenX - this.mouseX;
        let dy = this.mouseY - e.screenY;
        let camera = this.props.camera;
        if (e.button === 0) {
            let rot = mat4.mul([],
                mat4.fromRotation([], dy / 200, vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center))),
                mat4.fromRotation([], -dx / 200, camera.up));
            this.props.dispatch(setCameraAttrs({
                eye: vec3.add([], vec3.transformMat4([], vec3.sub([], camera.eye, camera.center), rot), camera.center),
                up: vec3.normalize([], vec3.transformMat4([], camera.up, rot)),
            }));
        } else if (e.button === 1) {
            this.props.dispatch(setCameraAttrs({
                fovy: Math.max(.1, Math.min(Math.PI - .1, camera.fovy * Math.exp(-dy / 200))),
            }));
        } else if (e.button === 2) {
            let n = vec3.normalize([], vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center)));
            this.props.dispatch(setCameraAttrs({
                eye: vec3.add([], camera.eye,
                    vec3.add([], vec3.scale([], n, -dx), vec3.scale([], camera.up, -dy))),
                center: vec3.add([], camera.center,
                    vec3.add([], vec3.scale([], n, -dx), vec3.scale([], camera.up, -dy))),
            }));
        }
        this.mouseX = e.screenX;
        this.mouseY = e.screenY;
    }

    wheel(e) {
        let camera = this.props.camera;
        this.props.dispatch(setCameraAttrs({
            fovy: Math.max(.1, Math.min(Math.PI - .1, camera.fovy * Math.exp(e.deltaY / 2000))),
        }));
    }

    contextMenu(e) {
        e.preventDefault();
    }

    render() {
        return (
            <Capture
                className="workspace-content" onMouseDown={this.mouseDown}
                onMouseMove={this.mouseMove} onContextMenu={this.contextMenu} onWheel={this.wheel}>
                <div className="workspace-content">
                    <canvas
                        style={{ width: this.props.width, height: this.props.height }}
                        width={Math.round(this.props.width)}
                        height={Math.round(this.props.height)}
                        ref={this.setCanvas} />
                </div>
                <Dom3d className="workspace-content workspace-overlay" camera={this.camera} width={this.props.width} height={this.props.height}>
                    <GridText {...{ width: this.props.settings.machineWidth, height: this.props.settings.machineHeight }} />
                </Dom3d>
            </Capture>
        );
    }
} // WorkspaceContent

WorkspaceContent = connect(
    state => ({ settings: state.settings, documents: state.documents, camera: state.camera })
)(withDocumentCache(WorkspaceContent));

class Workspace extends React.Component {
    render() {
        return (
            <div id="workspace" className="full-height" style={this.props.style}>
                <SetSize id="workspace-top" style={{ zoom: 'reset' }}>
                    <WorkspaceContent />
                </SetSize>
                <div id="workspace-controls">
                    <button onClick={this.props.reset}>Reset View</button>
                </div>
            </div>
        )
    }
}
Workspace = connect(
    undefined,
    dispatch => ({
        reset: () => dispatch(resetCamera())
    })
)(Workspace);
export default Workspace;
