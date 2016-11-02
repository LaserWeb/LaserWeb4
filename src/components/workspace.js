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
import { selectDocument, toggleSelectDocument } from '../actions/document';
import Capture from './capture';
import { withDocumentCache } from './document-cache'
import { Dom3d, Text3d } from './dom3d';
import DrawCommands from '../draw-commands'
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
        this.mouseUp = this.mouseUp.bind(this);
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
        this.hitTestFrameBuffer = this.regl.framebuffer({
            width: this.props.width,
            height: this.props.height,
        });
        this.drawCommands = new DrawCommands(this.regl);

        this.regl.frame(() => {
            this.regl.clear({
                color: [1, 1, 1, 1],
                depth: 1
            })
            this.drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(this.drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });
                for (let cachedDocument of this.props.documentCacheHolder.cache.values()) {
                    let {document} = cachedDocument;
                    if (document.type === 'path') {
                        this.drawCommands.noDepth(() => {
                            this.drawCommands.simple({
                                position: cachedDocument.triangles,
                                color: document.selected ? [.2, .2, 1, 1] : [0, 1, 1, 1],
                                primitive: 'triangles',
                                offset: 0,
                                count: cachedDocument.triangles.length / 3,
                            });
                            for (let o of cachedDocument.outlines)
                                this.drawCommands.simple({
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
        });
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

    hitTest(pageX, pageY) {
        if (!this.canvas || !this.regl || !this.drawCommands)
            return;
        this.hitTestFrameBuffer.resize(this.props.width, this.props.height);

        let result;
        this.regl({ framebuffer: this.hitTestFrameBuffer })(() => {
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            })
            this.drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(this.drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });
                for (let cachedDocument of this.props.documentCacheHolder.cache.values()) {
                    let {document, hitTestId} = cachedDocument;
                    if (document.type === 'path') {
                        this.drawCommands.noDepth(() => {
                            this.drawCommands.simple({
                                position: cachedDocument.triangles,
                                color: [
                                    ((hitTestId >> 24) & 0xff) / 0xff,
                                    ((hitTestId >> 16) & 0xff) / 0xff,
                                    ((hitTestId >> 8) & 0xff) / 0xff,
                                    (hitTestId & 0xff) / 0xff],
                                primitive: 'triangles',
                                offset: 0,
                                count: cachedDocument.triangles.length / 3,
                            });
                        });
                    }
                }
            });
            let r = ReactDOM.findDOMNode(this.canvas).getBoundingClientRect();
            let x = Math.round(pageX * window.devicePixelRatio - r.left);
            let y = Math.round(this.props.height - pageY * window.devicePixelRatio - r.top);
            let pixel = this.regl.read({ x, y, width: 1, height: 1 });
            let hitTestId = (pixel[0] << 24) | (pixel[1] << 16) | (pixel[2] << 8) | pixel[3];
            for (let cachedDocument of this.props.documentCacheHolder.cache.values())
                if (cachedDocument.hitTestId === hitTestId)
                    result = cachedDocument;
        });
        return result;
    }

    mouseDown(e) {
        let cachedDocument = this.hitTest(e.pageX, e.pageY);
        if (cachedDocument && e.button === 0) {
            if (e.ctrlKey || e.shiftKey)
                this.props.dispatch(toggleSelectDocument(cachedDocument.id));
            else
                this.props.dispatch(selectDocument(cachedDocument.id));
        } else {
            this.adjustingCamera = true;
            this.mouseX = e.screenX;
            this.mouseY = e.screenY;
        }
    }

    mouseUp(e) {
        this.adjustingCamera = false;
    }

    mouseMove(e) {
        if (!this.adjustingCamera)
            return;
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
                className="workspace-content" onMouseDown={this.mouseDown} onMouseUp={this.mouseUp}
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
