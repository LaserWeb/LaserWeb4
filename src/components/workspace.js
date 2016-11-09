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
import { selectDocument, toggleSelectDocument, translateSelectedDocuments } from '../actions/document';
import { setWorkspaceAttrs } from '../actions/workspace';

import Capture from './capture';
import { withDocumentCache } from './document-cache'
import { Dom3d, Text3d } from './dom3d';
import DrawCommands from '../draw-commands'
import SetSize from './setsize';
import { parseGcode } from '../lib/tmpParseGcode';

function perspectiveCamera({viewportWidth, viewportHeight, fovy, near, far, eye, center, up}) {
    let perspective = mat4.perspective([], fovy, viewportWidth / viewportHeight, near, far);
    let world = mat4.lookAt([], eye, center, up);
    let worldInv = mat4.invert([], world);
    return { fovy, perspective, world, worldInv };
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
        drawCommands.simple({ position: this.position, offset: 4, count: this.count - 4, color: [0, 0, 0, 1], translate: [0, 0, 0], primitive: 'lines' });
        drawCommands.simple({ position: this.position, offset: 0, count: 2, color: [1, 0, 0, 1], translate: [0, 0, 0], primitive: 'lines' });
        drawCommands.simple({ position: this.position, offset: 2, count: 2, color: [0, 1, 0, 1], translate: [0, 0, 0], primitive: 'lines' });
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

const parsedStride = 5;
const drawStride = 6;

class GcodePreview {
    setGcode(gcode) {
        if (this.gcode === gcode)
            return;
        this.gcode = gcode;
        let parsed = parseGcode(gcode);
        if (parsed.length < 2 * parsedStride) {

            this.array = null;
            this.g0Dist = 0;
            this.g1Time = 0;
            this.regl = null;
        } else {
            let array = new Float32Array((parsed.length - parsedStride) / parsedStride * drawStride * 2);

            let g0Dist = 0, g1Time = 0;
            for (let i = 0; i < parsed.length / parsedStride - 1; ++i) {

                let x1 = parsed[i * parsedStride + 0];
                let y1 = parsed[i * parsedStride + 1];
                let z1 = parsed[i * parsedStride + 2];
                let x2 = parsed[i * parsedStride + 5];
                let y2 = parsed[i * parsedStride + 6];
                let z2 = parsed[i * parsedStride + 7];
                let g = parsed[i * parsedStride + 8];
                let f = parsed[i * parsedStride + 9];

                array[i * drawStride * 2 + 0] = x1;
                array[i * drawStride * 2 + 1] = y1;
                array[i * drawStride * 2 + 2] = z1;
                array[i * drawStride * 2 + 3] = g;
                array[i * drawStride * 2 + 4] = g0Dist;
                array[i * drawStride * 2 + 5] = g1Time;

                let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
                if (g)
                    g1Time += dist / f;
                else
                    g0Dist += dist;

                array[i * drawStride * 2 + 6] = x2;
                array[i * drawStride * 2 + 7] = y2;
                array[i * drawStride * 2 + 8] = z2;
                array[i * drawStride * 2 + 9] = g;
                array[i * drawStride * 2 + 10] = g0Dist;
                array[i * drawStride * 2 + 11] = g1Time;
            }
            this.array = array;
            this.g0Dist = g0Dist;
            this.g1Time = g1Time;
            this.regl = null;
        }
    }

    draw(drawCommands, {g0Rate, simTime}) {
        if (this.regl !== drawCommands.regl || !this.buffer) {
            this.regl = drawCommands.regl;
            if (this.buffer)
                this.buffer.destroy();
            this.buffer = drawCommands.regl.buffer(this.array);
        }

        if (this.array) {
            drawCommands.gcode({
                buffer: this.buffer,
                count: this.array.length / drawStride,
                g0Rate,
                simTime,
            });
        }
    }
};

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
        if (this.regl) {
            this.regl.destroy();
            this.regl = null;
        }
        if (!canvas)
            return;

        this.regl = require('regl')({
            canvas: ReactDOM.findDOMNode(canvas)
        });
        this.hitTestFrameBuffer = this.regl.framebuffer({
            width: this.props.width,
            height: this.props.height,
        });
        this.useHitTestFrameBuffer = this.regl({ framebuffer: this.hitTestFrameBuffer })
        this.drawCommands = new DrawCommands(this.regl);
        this.props.documentCacheHolder.regl = this.regl;

        this.regl.frame(() => {
            this.regl.clear({
                color: [1, 1, 1, 1],
                depth: 1
            })
            this.drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(this.drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });
                if (this.props.workspace.showDocuments) {
                    for (let cachedDocument of this.props.documentCacheHolder.cache.values()) {
                        let {document} = cachedDocument;
                        switch (document.type) {
                            case 'path':
                                this.drawCommands.noDepth(() => {
                                    this.drawCommands.simple({
                                        position: cachedDocument.triangles,
                                        translate: document.translate,
                                        color: document.selected ? [.2, .2, 1, 1] : [0, 1, 1, 1],
                                        primitive: 'triangles',
                                        offset: 0,
                                        count: cachedDocument.triangles.length / 3,
                                    });
                                    for (let o of cachedDocument.outlines)
                                        this.drawCommands.simple({
                                            position: o,
                                            translate: document.translate,
                                            color: [0, 0, 0, 1],
                                            primitive: 'line strip',
                                            offset: 0,
                                            count: o.length / 3,
                                        });
                                });
                                break;
                            case 'image':
                                if (cachedDocument.image && cachedDocument.texture && cachedDocument.regl === this.regl)
                                    this.drawCommands.noDepth(() => {
                                        this.drawCommands.image({
                                            translate: document.translate,
                                            size: [cachedDocument.image.width / document.dpi * 25.4, cachedDocument.image.height / document.dpi * 25.4],
                                            texture: cachedDocument.texture,
                                            selected: document.selected,
                                        });
                                    });
                                break;
                        }
                    }
                }
                this.props.gcodePreview.draw(this.drawCommands, this.props.workspace);
            });
            //console.log(this.regl.stats.bufferCount, this.regl.stats.cubeCount, this.regl.stats.elementsCount, this.regl.stats.framebufferCount, this.regl.stats.maxTextureUnits, this.regl.stats.renderbufferCount, this.regl.stats.shaderCount, this.regl.stats.textureCount, );
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

    rayFromPoint(pageX, pageY) {
        let r = ReactDOM.findDOMNode(this.canvas).getBoundingClientRect();
        let x = 2 * (pageX * window.devicePixelRatio - r.left) / (this.props.width) - 1;
        let y = -2 * (pageY * window.devicePixelRatio - r.top) / (this.props.height) + 1;
        let cursor = [x * this.props.width / this.props.height * Math.tan(this.camera.fovy / 2), y * Math.tan(this.camera.fovy / 2), -1];
        let origin = vec3.transformMat4([], [0, 0, 0], this.camera.worldInv);
        let direction = vec3.sub([], vec3.transformMat4([], cursor, this.camera.worldInv), origin);
        return { origin, direction };
    }

    xyInterceptFromPoint(pageX, pageY) {
        let {origin, direction} = this.rayFromPoint(pageX, pageY);
        if (!direction[2])
            return;
        let t = -origin[2] / direction[2];
        return [origin[0] + t * direction[0], origin[1] + t * direction[1], 0];
    }

    hitTest(pageX, pageY) {
        if (!this.canvas || !this.regl || !this.drawCommands)
            return;
        this.hitTestFrameBuffer.resize(this.props.width, this.props.height);

        let result;
        this.useHitTestFrameBuffer(() => {
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            })
            this.drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(this.drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });
                if (this.props.workspace.showDocuments) {
                    for (let cachedDocument of this.props.documentCacheHolder.cache.values()) {
                        let {document, hitTestId} = cachedDocument;
                        if (document.type === 'path') {
                            this.drawCommands.noDepth(() => {
                                this.drawCommands.simple({
                                    position: cachedDocument.triangles,
                                    translate: document.translate,
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
                        } else if (document.type === 'image' && cachedDocument.image && cachedDocument.texture && cachedDocument.regl === this.regl) {
                            this.drawCommands.noDepth(() => {
                                this.drawCommands.simple({
                                    position: [
                                        [0, 0, 0],
                                        [cachedDocument.image.width / document.dpi * 25.4, 0, 0],
                                        [cachedDocument.image.width / document.dpi * 25.4, cachedDocument.image.height / document.dpi * 25.4, 0],
                                        [cachedDocument.image.width / document.dpi * 25.4, cachedDocument.image.height / document.dpi * 25.4, 0],
                                        [0, cachedDocument.image.height / document.dpi * 25.4, 0],
                                        [0, 0, 0]],
                                    translate: document.translate,
                                    color: [
                                        ((hitTestId >> 24) & 0xff) / 0xff,
                                        ((hitTestId >> 16) & 0xff) / 0xff,
                                        ((hitTestId >> 8) & 0xff) / 0xff,
                                        (hitTestId & 0xff) / 0xff],
                                    primitive: 'triangles',
                                    offset: 0,
                                    count: 6,
                                });
                            });
                        }
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
        this.mouseX = e.pageX;
        this.mouseY = e.pageY;
        this.movingObjects = false;
        this.adjustingCamera = false;
        this.needToSelect = null;
        this.toggle = e.ctrlKey || e.shiftKey;
        this.moveStarted = false;

        let cachedDocument = this.hitTest(e.pageX, e.pageY);
        if (cachedDocument && e.button === 0) {
            this.movingObjects = true;
            if (cachedDocument.document.selected)
                this.needToSelect = cachedDocument.document.id;
            else {
                if (this.toggle)
                    this.props.dispatch(toggleSelectDocument(cachedDocument.id));
                else
                    this.props.dispatch(selectDocument(cachedDocument.id));
            }
        } else {
            this.adjustingCamera = true;
        }
    }

    mouseUp(e) {
        if (this.needToSelect) {
            if (this.toggle)
                this.props.dispatch(toggleSelectDocument(this.needToSelect));
            else
                this.props.dispatch(selectDocument(this.needToSelect));
        }
    }

    mouseMove(e) {
        let dx = e.pageX - this.mouseX;
        let dy = this.mouseY - e.pageY;
        if (this.movingObjects) {
            if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10)
                this.moveStarted = true;
            if (this.moveStarted) {
                this.needToSelect = null;
                let p1 = this.xyInterceptFromPoint(e.pageX, e.pageY);
                let p2 = this.xyInterceptFromPoint(this.mouseX, this.mouseY);
                if (p1 && p2)
                    this.props.dispatch(translateSelectedDocuments(vec3.sub([], p1, p2)));
                this.mouseX = e.pageX;
                this.mouseY = e.pageY;
            }
        } else if (this.adjustingCamera) {
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
            this.mouseX = e.pageX;
            this.mouseY = e.pageY;
        }
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
    state => ({ settings: state.settings, documents: state.documents, camera: state.camera, workspace: state.workspace })
)(withDocumentCache(WorkspaceContent));

class Workspace extends React.Component {
    componentWillMount() {
        this.gcodePreview = new GcodePreview();
    }

    render() {
        let {gcode, workspace, setG0Rate, setSimTime, setShowDocuments} = this.props;
        this.gcodePreview.setGcode(gcode);
        return (
            <div id="workspace" className="full-height" style={this.props.style}>
                <SetSize id="workspace-top" style={{ zoom: 'reset' }}>
                    <WorkspaceContent gcodePreview={this.gcodePreview} />
                </SetSize>
                <div id="workspace-controls">
                    <table>
                        <tbody>
                            <tr>
                                <td />
                                <td><button onClick={this.props.reset}>Reset View</button></td>
                            </tr>
                            <tr>
                                <td>Show Documents</td>
                                <td><input checked={workspace.showDocuments} onChange={setShowDocuments} type="checkbox" /></td>
                                <td>mm/min</td>
                            </tr>
                            <tr>
                                <td>g0 rate</td>
                                <td><input value={workspace.g0Rate} onChange={setG0Rate} type="number" step="any" /></td>
                                <td>mm/min</td>
                            </tr>
                            <tr>
                                <td>Sim time</td>
                                <td><input value={workspace.simTime} onChange={setSimTime} type="range" step="any" max={this.gcodePreview.g1Time + this.gcodePreview.g0Dist / workspace.g0Rate} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}
Workspace = connect(
    state => ({ gcode: state.gcode, workspace: state.workspace }),
    dispatch => ({
        reset: () => dispatch(resetCamera()),
        setG0Rate: e => dispatch(setWorkspaceAttrs({ g0Rate: +e.target.value })),
        setSimTime: e => dispatch(setWorkspaceAttrs({ simTime: +e.target.value })),
        setShowDocuments: e => dispatch(setWorkspaceAttrs({ showDocuments: e.target.checked })),
    })
)(Workspace);
export default Workspace;
