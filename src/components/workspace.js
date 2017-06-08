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

import { mat2d, mat4, vec3, vec4 } from 'gl-matrix';
import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom';

import { GlobalStore } from '..';
import { setCameraAttrs, zoomArea } from '../actions/camera'
import { selectDocument, toggleSelectDocument, transform2dSelectedDocuments, removeDocumentSelected } from '../actions/document';
import { setWorkspaceAttrs } from '../actions/workspace';
import { runCommand, jogTo } from './com.js';

import { withDocumentCache } from './document-cache'
import { Dom3d, Text3d } from './dom3d';
import { DrawCommands } from '../draw-commands'
import { GcodePreview } from '../draw-commands/GcodePreview'
import { LaserPreview } from '../draw-commands/LaserPreview'
import { convertOutlineToThickLines } from '../draw-commands/thick-lines'
import { Input } from './forms.js';
import SetSize from './setsize';
import { dist } from '../lib/cam';
import { parseGcode } from '../lib/tmpParseGcode';
import Pointable from '../lib/Pointable';
import { clamp } from '../lib/helpers'

import CommandHistory from './command-history'

import { Button, ButtonToolbar, ButtonGroup } from 'react-bootstrap'
import Icon from './font-awesome'

import Draggable from 'react-draggable';

import { VideoPort } from './webcam'
import { ImagePort } from './image-filters'

import { LiveJogging } from './jog'

import { keyboardLogger, bindKeys, unbindKeys } from './keyboard'

function calcCamera({ viewportWidth, viewportHeight, fovy, near, far, eye, center, up, showPerspective, machineX, machineY }) {
    let perspective;
    let view = mat4.lookAt([], eye, center, up);
    view = mat4.translate([], view, [-machineX, -machineY, 0]);
    if (showPerspective)
        perspective = mat4.perspective([], fovy, viewportWidth / viewportHeight, near, far);
    else {
        let yBound = vec3.distance(eye, center) * Math.tan(fovy / 2);
        perspective = mat4.identity([]);
        view = mat4.mul([],
            mat4.ortho([], -yBound * viewportWidth / viewportHeight, yBound * viewportWidth / viewportHeight, -yBound, yBound, near, far),
            view);
        fovy = 0;
    }
    let viewInv = mat4.invert([], view);
    return { fovy, perspective, view, viewInv };
}

const MAJOR_GRID_SPACING = 50;
const MINOR_GRID_SPACING = 10;
const CROSSHAIR = 5

class LightenMachineBounds {
    draw(drawCommands, { perspective, view, x, y, width, height }) {
        if (!this.triangles || this.x !== x || this.y !== y || this.width !== width || this.height !== height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            let x2 = x + width;
            let y2 = y + height;
            let a = [
                x, y, x2, y2, x, y2,
                x, y, x2, y, x2, y2,
            ];
            this.triangles = new Float32Array(a);
        }
        drawCommands.basic2d({ perspective, view, position: this.triangles, offset: 0, count: this.triangles.length / 2, color: [1, 1, 1, 1], transform2d: [1, 0, 0, 1, 0, 0], primitive: drawCommands.gl.TRIANGLES });
    }
};

class Grid {
    draw(drawCommands, { perspective, view, width, height, major = MAJOR_GRID_SPACING, minor = MINOR_GRID_SPACING }) {
        if (!this.maingrid || !this.origin || this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            let a = [];
            let b = [];
            a.push(-this.width, -this.height, 0, this.width, -this.height, 0);
            a.push(-this.width, -this.height, 0, -this.width, this.height, 0);
            for (let x = minor; x < this.width; x += minor) {
                a.push(x, -this.height, 0, x, this.height, 0);
                a.push(-x, -this.height, 0, -x, this.height, 0);
                if (x % major === 0) {
                    b.push(x, -this.height, 0, x, this.height, 0);
                    b.push(-x, -this.height, 0, -x, this.height, 0);
                }
            }
            a.push(this.width, -this.height, 0, this.width, this.height, 0);
            for (let y = minor; y < this.height; y += minor) {
                a.push(-this.width, y, 0, this.width, y, 0);
                a.push(-this.width, -y, 0, this.width, -y, 0);
                if (y % major === 0) {
                    b.push(-this.width, y, 0, this.width, y, 0);
                    b.push(-this.width, -y, 0, this.width, -y, 0);
                }
            }
            a.push(-this.width, this.height, 0, this.width, this.height, 0);
            this.maingrid = new Float32Array(a);
            this.darkgrid = new Float32Array(b)
            this.maincount = a.length / 3;
            this.darkcount = b.length / 3;

            let c = [];
            c.push(-this.width, 0, 0, this.width, 0, 0);
            c.push(0, -this.height, 0, 0, this.height, 0);
            this.origin = new Float32Array(c)
            this.origincount = c.length / 3
        }

        drawCommands.basic({ perspective, view, position: this.maingrid, offset: 0, count: this.maincount, color: [0.7, 0.7, 0.7, 0.95], scale: [1, 1, 1], translate: [0, 0, 0], primitive: drawCommands.gl.LINES }); // Gray grid
        drawCommands.basic({ perspective, view, position: this.darkgrid, offset: 0, count: this.darkcount, color: [0.5, 0.5, 0.5, 0.95], scale: [1, 1, 1], translate: [0, 0, 0], primitive: drawCommands.gl.LINES }); // dark grid

        drawCommands.basic({ perspective, view, position: this.origin, offset: 0, count: 2, color: [0.6, 0, 0, 1], scale: [1, 1, 1], translate: [0, 0, 0], primitive: drawCommands.gl.LINES }); // Red
        drawCommands.basic({ perspective, view, position: this.origin, offset: 2, count: 2, color: [0, 0.8, 0, 1], scale: [1, 1, 1], translate: [0, 0, 0], primitive: drawCommands.gl.LINES }); // Green
    }
};

function GridText(props) {
    let { minor = MINOR_GRID_SPACING, major = MAJOR_GRID_SPACING, width, height } = props;
    let size = Math.min(major / 3, 10)
    let a = [];
    for (let x = major; x <= width; x += major) {
        a.push(<Text3d key={'x' + x} x={x} y={-5} size={size} style={{ color: '#CC0000' }} label={String(x)} />);
        a.push(<Text3d key={'x' + -x} x={-x} y={-5} size={size} style={{ color: '#CC0000' }} label={String(-x)} />);
    }
    a.push(<Text3d key="x-label" x={width + 15} y={0} size={size} style={{ color: '#CC0000' }}>X</Text3d>);
    for (let y = major; y <= height; y += major) {
        a.push(<Text3d key={'y' + y} x={-10} y={y} size={size} style={{ color: '#00CC00' }} label={String(y)} />);
        a.push(<Text3d key={'y' + -y} x={-10} y={-y} size={size} style={{ color: '#00CC00' }} label={String(-y)} />);
    }
    a.push(<Text3d key="y-label" x={0} y={height + 15} size={size} style={{ color: '#00CC00' }}>Y</Text3d>);
    return <div>{a}</div>;
}

const markerOrthSize = 10;
const markerPointSize = 6;

class MachineBounds {
    draw(drawCommands, { perspective, view, x, y, width, height }) {
        if (!this.markers || this.x !== x || this.y !== y || this.width !== width || this.height !== height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            let x2 = x + width;
            let y2 = y + height;
            let a = [
                x, y, x, y + markerOrthSize, x - markerPointSize, y - markerPointSize,
                x, y, x - markerPointSize, y - markerPointSize, x + markerOrthSize, y,
                x2, y, x2 + markerPointSize, y - markerPointSize, x2, y + markerOrthSize,
                x2, y, x2 - markerOrthSize, y, x2 + markerPointSize, y - markerPointSize,
                x2, y2, x2, y2 - markerOrthSize, x2 + markerPointSize, y2 + markerPointSize,
                x2, y2, x2 + markerPointSize, y2 + markerPointSize, x2 - markerOrthSize, y2,
                x, y2, x + markerOrthSize, y2, x - markerPointSize, y2 + markerPointSize,
                x, y2, x - markerPointSize, y2 + markerPointSize, x, y2 - markerOrthSize,
            ];
            this.markers = new Float32Array(a);
        }

        drawCommands.basic2d({ perspective, view, position: this.markers, offset: 0, count: this.markers.length / 2, color: [0, 0, 0, 0.8], transform2d: [1, 0, 0, 1, 0, 0], primitive: drawCommands.gl.TRIANGLES });
    }
};

class FloatingControls extends React.Component {
    componentWillMount() {
        this.state = { linkScale: true };
        this.linkScaleChanged = e => {
            this.setState({ linkScale: e.target.checked, degrees: 45 });
        }
        this.scale = (sx, sy, anchor = 'C') => {
            let cx, cy
            switch (anchor) {
                case 'TL':
                    cx = this.bounds.x1;
                    cy = this.bounds.y2;
                    break;
                case 'TR':
                    cx = this.bounds.x2;
                    cy = this.bounds.y2;
                    break;
                case 'BL':
                    cx = this.bounds.x1;
                    cy = this.bounds.y1;
                    break;
                case 'BR':
                    cx = this.bounds.x2;
                    cy = this.bounds.y1;
                    break;
                case 'C':
                    cx = (this.bounds.x1 + this.bounds.x2) / 2;
                    cy = (this.bounds.y1 + this.bounds.y2) / 2;
                    break;
            }
            this.props.dispatch(transform2dSelectedDocuments([sx, 0, 0, sy, cx - sx * cx, cy - sy * cy]));
        }

        this.setDegrees = degrees => {
            this.setState({ degrees })
        }

        this.rotate = (e,clockwise) => {
            let rotate = this.state.degrees * ((clockwise) ? -1 : 1);
            this.props.dispatch(transform2dSelectedDocuments(
                mat2d.translate([],
                    mat2d.rotate(
                        [],
                        mat2d.fromTranslation([], [this.rotateCenter[0], this.rotateCenter[1]]),
                        rotate * Math.PI / 180),
                    [-this.rotateCenter[0], -this.rotateCenter[1]]
                )
            ));
            this.rotateDocs = GlobalStore().getState().documents;
            this.forceUpdate();
        }
        this.setMinX = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, v - this.bounds.x1, 0]));
        }
        this.setCenterX = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, v - (this.bounds.x1 + this.bounds.x2) / 2, 0]));
        }
        this.setMaxX = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, v - this.bounds.x2, 0]));
        }
        this.setSizeX = v => {
            if (v > 0 && this.bounds.x2 - this.bounds.x1 > 0) {
                let s = v / (this.bounds.x2 - this.bounds.x1);
                if (this.state.linkScale)
                    this.scale(s, s);
                else
                    this.scale(s, 1);
            }
        }
        this.setMinY = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, 0, v - this.bounds.y1]));
        }
        this.setCenterY = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, 0, v - (this.bounds.y1 + this.bounds.y2) / 2]));
        }
        this.setMaxY = v => {
            this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, 0, v - this.bounds.y2]));
        }
        this.setSizeY = v => {
            if (v > 0 && this.bounds.y2 - this.bounds.y1 > 0) {
                let s = v / (this.bounds.y2 - this.bounds.y1);
                if (this.state.linkScale)
                    this.scale(s, s);
                else
                    this.scale(1, s);
            }
        }

        this.toolOptimize = (doc, scale, anchor = 'C') => {
            if (!scale) scale = 25.4 / this.props.settings.dpiBitmap;
            if (doc.originalPixels) {
                let targetwidth = doc.originalPixels[0] * scale;
                let targetheight = doc.originalPixels[1] * scale;
                let height = this.bounds.y2 - this.bounds.y1;
                let width = this.bounds.x2 - this.bounds.x1;
                this.scale(targetwidth / width, targetheight / height, anchor)
            }
        }
    }

    render() {
        let tools;
        let found = false;
        let bounds = this.bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
        for (let cache of this.props.documentCacheHolder.cache.values()) {
            let doc = cache.document;
            if (doc.selected && doc.transform2d && cache.bounds) {
                found = true;
                bounds.x1 = Math.min(bounds.x1, cache.bounds.x1 + doc.transform2d[4]);
                bounds.y1 = Math.min(bounds.y1, cache.bounds.y1 + doc.transform2d[5]);
                bounds.x2 = Math.max(bounds.x2, cache.bounds.x2 + doc.transform2d[4]);
                bounds.y2 = Math.max(bounds.y2, cache.bounds.y2 + doc.transform2d[5]);

                if (doc.type == 'image' && doc.originalPixels) {
                    tools = <tfoot>
                        <tr>
                            <td><Icon name="gear" /></td><td colSpan="6" >
                                <ButtonGroup>
                                    <Button bsSize="xs" bsStyle="warning" onClick={(e) => this.toolOptimize(doc, this.props.settings.machineBeamDiameter, this.props.settings.toolImagePosition)}><Icon name="picture-o" /> Raster Opt.</Button>
                                    <Button bsSize="xs" bsStyle="danger" onClick={(e) => this.toolOptimize(doc, null, this.props.settings.toolImagePosition)}><Icon name="undo" /></Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    </tfoot>
                }
            }
        }
        if (!found || !this.props.camera)
            return <div />

        if (this.rotateDocs !== this.props.documents) {
            this.baseRotate = 0;
            this.rotateCenter = [(bounds.x1 + bounds.x2) / 2, (bounds.y1 + bounds.y2) / 2, 0];
            this.rotateDocs = this.props.documents;
        }

        let p =
            vec4.transformMat4([],
                vec4.transformMat4([], [bounds.x1, bounds.y1, 0, 1], this.props.camera.view),
                this.props.camera.perspective);
        let x = (p[0] / p[3] + 1) * this.props.workspaceWidth / 2 - 20;
        let y = this.props.workspaceHeight - (p[1] / p[3] + 1) * this.props.workspaceHeight / 2 + 20;

        x = x / window.devicePixelRatio - this.props.width;
        y = y / window.devicePixelRatio;
        x = Math.min(Math.max(x, 0), this.props.workspaceWidth / window.devicePixelRatio - this.props.width);
        y = Math.min(Math.max(y, 0), this.props.workspaceHeight / window.devicePixelRatio - this.props.height);

        let round = n => Math.round(n * 100) / 100;

        return (
            <table style={{ position: 'relative', left: x, top: y, border: '2px solid #ccc', margin: '1px', padding: '2px', backgroundColor: '#eee' }} className="floating-controls" >
                <tbody>
                    <tr>
                        <td></td>
                        <td>Min</td>
                        <td>Center</td>
                        <td>Max</td>
                        <td>Size</td>
                        <td></td>
                        <td>Rot</td>
                    </tr>
                    <tr>
                        <td><span className="label label-danger">X</span></td>
                        <td><Input value={round(bounds.x1)} onChangeValue={this.setMinX} type="number" step="any" tabIndex="1" /></td>
                        <td><Input value={round((bounds.x1 + bounds.x2) * .5)} onChangeValue={this.setCenterX} type="number" step="any" tabIndex="3" /></td>
                        <td><Input value={round(bounds.x2)} type="number" onChangeValue={this.setMaxX} step="any" tabIndex="5" /></td>
                        <td><Input value={round(bounds.x2 - bounds.x1)} type="number" onChangeValue={this.setSizeX} step="any" tabIndex="7" /></td>
                        <td rowSpan={2}>
                            &#x2511;<br /><input type="checkbox" checked={this.state.linkScale} onChange={this.linkScaleChanged} tabIndex="10" /><br />&#x2519;
                        </td>
                        <td rowSpan={2}><Input value={round(this.state.degrees)} onChangeValue={this.setDegrees} type="number" step="any" tabIndex="10" /><br />
                            <ButtonToolbar>
                                <Button bsSize="xsmall" onClick={e => this.rotate(e, false)} bsStyle="info"><Icon name="rotate-left" /></Button>
                                <Button bsSize="xsmall" onClick={e => this.rotate(e, true)} bsStyle="info"><Icon name="rotate-right" /></Button>
                            </ButtonToolbar>
                        </td>
                    </tr>
                    <tr>
                        <td><span className="label label-success">Y</span></td>
                        <td><Input value={round(bounds.y1)} onChangeValue={this.setMinY} type="number" step="any" tabIndex="2" /></td>
                        <td><Input value={round((bounds.y1 + bounds.y2) * .5)} onChangeValue={this.setCenterY} type="number" step="any" tabIndex="4" /></td>
                        <td><Input value={round(bounds.y2)} type="number" onChangeValue={this.setMaxY} step="any" tabIndex="6" /></td>
                        <td><Input value={round(bounds.y2 - bounds.y1)} type="number" onChangeValue={this.setSizeY} step="any" tabIndex="8" /></td>
                    </tr>
                </tbody>
                {tools}
            </table>
        );
    }
} // FloatingControls

const thickSquare = convertOutlineToThickLines([0, 0, 1, 0, 1, 1, 0, 1, 0, 0]);

function drawDocuments(perspective, view, drawCommands, documentCacheHolder) {
    for (let cachedDocument of documentCacheHolder.cache.values()) {
        let { document } = cachedDocument;
        if (document.rawPaths) {
            if (document.visible) {
                if (document.fillColor[3] && cachedDocument.triangles.length)
                    drawCommands.basic2d({
                        perspective, view,
                        position: cachedDocument.triangles,
                        transform2d: document.transform2d,
                        color: document.fillColor,
                        primitive: drawCommands.gl.TRIANGLES,
                        offset: 0,
                        count: cachedDocument.triangles.length / 2,
                    });
                if (document.strokeColor[3] || !cachedDocument.triangles.length)
                    for (let o of cachedDocument.outlines)
                        drawCommands.basic2d({
                            perspective, view,
                            position: o,
                            transform2d: document.transform2d,
                            color: document.strokeColor[3] ? document.strokeColor : [1, 0, 0, 1],
                            primitive: drawCommands.gl.LINE_STRIP,
                            offset: 0,
                            count: o.length / 2,
                        });
            }
        } else if (document.type === 'image') {
            if (cachedDocument.image && cachedDocument.texture && cachedDocument.drawCommands === drawCommands) {
                if (document.visible !== false) {
                    drawCommands.image({
                        perspective, view,
                        transform2d: document.transform2d,
                        texture: cachedDocument.texture,
                        selected: false,
                    });
                }
            }
        }
    }
} // drawDocuments

function drawSelectedDocuments(perspective, view, drawCommands, documentCacheHolder) {
    for (let cachedDocument of documentCacheHolder.cache.values()) {
        let { document } = cachedDocument;
        if (!document.selected)
            continue;
        if (document.rawPaths) {
            for (let outline of cachedDocument.thickOutlines) {
                drawCommands.thickLines({
                    perspective, view,
                    buffer: outline,
                    transform2d: document.transform2d,
                    thickness: 5,
                    color1: [0, 0, 1, 1],
                    color2: [1, 1, 1, 1],
                });
            }
        } else if (document.type === 'image') {
            if (cachedDocument.image && cachedDocument.texture && cachedDocument.drawCommands === drawCommands)
                drawCommands.thickLines({
                    perspective, view,
                    buffer: thickSquare,
                    transform2d: mat2d.mul([], document.transform2d, [cachedDocument.image.width, 0, 0, cachedDocument.image.height, 0, 0]),
                    thickness: 5,
                    color1: [0, 0, 1, 1],
                    color2: [1, 1, 1, 1],
                });
        }
    }
} // drawSelectedDocuments

function drawDocumentsHitTest(perspective, view, drawCommands, documentCacheHolder) {
    for (let cachedDocument of documentCacheHolder.cache.values()) {
        let { document, hitTestId } = cachedDocument;
        let color = [((hitTestId >> 24) & 0xff) / 0xff, ((hitTestId >> 16) & 0xff) / 0xff, ((hitTestId >> 8) & 0xff) / 0xff, (hitTestId & 0xff) / 0xff];
        if (document.rawPaths) {
            if (document.visible !== false) {
                if (document.fillColor[3])
                    drawCommands.basic2d({
                        perspective, view,
                        position: cachedDocument.triangles,
                        transform2d: document.transform2d,
                        color,
                        primitive: drawCommands.gl.TRIANGLES,
                        offset: 0,
                        count: cachedDocument.triangles.length / 2,
                    });
                for (let o of cachedDocument.thickOutlines)
                    drawCommands.thickLines({
                        perspective, view,
                        buffer: o,
                        transform2d: document.transform2d,
                        thickness: 10,
                        color1: color,
                        color2: color,
                    })
            }
        } else if (document.type === 'image' && cachedDocument.image && cachedDocument.texture && cachedDocument.drawCommands === drawCommands) {
            if (document.visible !== false) {
                let w = cachedDocument.image.width;
                let h = cachedDocument.image.height;
                drawCommands.basic2d({
                    perspective, view,
                    position: new Float32Array([0, 0, w, 0, w, h, w, h, 0, h, 0, 0]),
                    transform2d: document.transform2d,
                    color,
                    primitive: drawCommands.gl.TRIANGLES,
                    offset: 0,
                    count: 6,
                });
            }
        }
    }
}

function initCursor() {
    let numSides = 10;
    let a = [];
    for (let i = 0; i < numSides; ++i)
        a.push(
            0, 0, 0,
            Math.cos(i * Math.PI * 2 / numSides) / 2,
            Math.sin(i * Math.PI * 2 / numSides) / 2,
            1,
            Math.cos((i + 1) * Math.PI * 2 / numSides) / 2,
            Math.sin((i + 1) * Math.PI * 2 / numSides) / 2,
            1,
        );
    return new Float32Array(a);
}
const cursor = initCursor();

function drawCursor(perspective, view, drawCommands, cursorPos) {
    let height = 40;
    let diameter = 20;
    drawCommands.basic({
        perspective,
        view,
        scale: new Float32Array([diameter, diameter, height]),
        translate: new Float32Array(cursorPos),
        color: new Float32Array([0, 0, 1, .5]),
        primitive: drawCommands.gl.TRIANGLES,
        position: cursor,
        offset: 0,
        count: cursor.length / 3,
    });
}

class WorkspaceContent extends React.Component {

    constructor(props) {
        super(props);
        this.bindings = [
            [['del'], this.removeSelected.bind(this)],
        ]
    }

    componentWillMount() {
        this.pointers = [];
        this.lightenMachineBounds = new LightenMachineBounds();
        this.grid = new Grid();
        this.machineBounds = new MachineBounds();
        this.setCanvas = this.setCanvas.bind(this);
        this.documentCache = [];
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerCancel = this.onPointerCancel.bind(this);

        this.handleMouseEnter = this.handleMouseEnter.bind(this)
        this.handleMouseLeave = this.handleMouseLeave.bind(this)

        this.contextMenu = this.contextMenu.bind(this);
        this.wheel = this.wheel.bind(this);
        this.setCamera(this.props);

        bindKeys(this.bindings, 'workspace')
    }

    componentWillUnmount() {
        unbindKeys(this.bindings, 'workspace')
    }

    removeSelected() {
        if (this.props.mode === 'jog') return;
        if (this.props.documents.find((d) => (d.selected)))
            this.props.dispatch(removeDocumentSelected());
    }

    setCanvas(canvas) {
        if (this.canvas === canvas)
            return;
        this.canvas = canvas;
        if (this.drawCommands) {
            this.drawCommands.destroy();
            this.drawCommands = null;
        }
        if (!canvas)
            return;

        let gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, preserveDrawingBuffer: true });
        this.drawCommands = new DrawCommands(gl);
        this.props.documentCacheHolder.drawCommands = this.drawCommands;
        this.hitTestFrameBuffer = this.drawCommands.createFrameBuffer(this.props.width, this.props.height);

        // WEBCAM INIT
        let workspaceSize = { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight }

        let draw = () => {
            if (!this.canvas)
                return;

            if (this.props.settings.toolDisplayCache) {
                if (this.__updating) {
                    this.__updating = false;
                } else {
                    return requestAnimationFrame(draw);
                }
            }

            if (this.props.width > 1 && this.props.height > 1 && (this.props.workspace.width !== this.props.width || this.props.workspace.height !== this.props.height)) {
                this.props.dispatch(setWorkspaceAttrs({ width: this.props.width, height: this.props.height }));
                if (!this.props.workspace.initialZoom) {
                    this.props.dispatch(setWorkspaceAttrs({ initialZoom: true }));
                    this.props.dispatch(zoomArea(
                        this.props.settings.machineBottomLeftX - 10,
                        this.props.settings.machineBottomLeftY - 10,
                        this.props.settings.machineBottomLeftX + this.props.settings.machineWidth + 10,
                        this.props.settings.machineBottomLeftY + this.props.settings.machineHeight + 10
                    ));
                }
            }

            gl.viewport(0, 0, this.props.width, this.props.height);
            gl.clearColor(.8, .8, .8, 1);
            gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);

            let machineX = this.props.settings.machineBottomLeftX - this.props.workspace.workOffsetX;
            let machineY = this.props.settings.machineBottomLeftY - this.props.workspace.workOffsetY;

            gl.clearDepth(1);
            this.lightenMachineBounds.draw(this.drawCommands, {
                perspective: this.camera.perspective, view: this.camera.view, x: machineX, y: machineY, width: this.props.settings.machineWidth, height: this.props.settings.machineHeight,
            });
            gl.clearDepth(1);

            this.grid.draw(this.drawCommands, {
                perspective: this.camera.perspective, view: this.camera.view,
                width: this.props.settings.toolGridWidth, height: this.props.settings.toolGridHeight,
                minor: this.props.settings.toolGridMinorSpacing,
                major: this.props.settings.toolGridMajorSpacing,
            });
            this.machineBounds.draw(this.drawCommands, {
                perspective: this.camera.perspective, view: this.camera.view, x: machineX, y: machineY, width: this.props.settings.machineWidth, height: this.props.settings.machineHeight,
            });
            if (this.props.workspace.showDocuments)
                drawDocuments(this.camera.perspective, this.camera.view, this.drawCommands, this.props.documentCacheHolder);
            if (this.props.workspace.showLaser) {
                gl.blendEquation(this.drawCommands.EXT_blend_minmax.MIN_EXT);
                gl.blendFunc(gl.ONE, gl.ONE);
                this.props.laserPreview.draw(
                    this.drawCommands, this.camera.perspective, this.camera.view, this.props.settings.machineBeamDiameter, this.props.settings.gcodeSMaxValue, this.props.workspace.g0Rate, this.props.workspace.simTime);
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
            if (this.props.workspace.showGcode)
                this.props.gcodePreview.draw(
                    this.drawCommands, this.camera.perspective, this.camera.view, this.props.workspace.g0Rate, this.props.workspace.simTime);
            if (this.props.workspace.showDocuments)
                drawSelectedDocuments(this.camera.perspective, this.camera.view, this.drawCommands, this.props.documentCacheHolder);
            if (this.props.workspace.showCursor)
                drawCursor(this.camera.perspective, this.camera.view, this.drawCommands, this.props.workspace.cursorPos);

            requestAnimationFrame(draw);
        };
        draw();
    }

    componentDidUpdate() {
        this.__updating = true;
    }

    componentWillReceiveProps(nextProps) {
        this.setCamera(nextProps);
    }

    setCamera(props) {
        this.camera =
            calcCamera({
                viewportWidth: props.width,
                viewportHeight: props.height,
                fovy: props.camera.fovy,
                near: .1,
                far: 2000,
                eye: props.camera.eye,
                center: props.camera.center,
                up: props.camera.up,
                showPerspective: props.camera.showPerspective,
                machineX: props.settings.machineBottomLeftX - props.workspace.workOffsetX,
                machineY: props.settings.machineBottomLeftY - props.workspace.workOffsetY,
            });
    }

    rayFromPoint(pageX, pageY) {
        let r = ReactDOM.findDOMNode(this.canvas).getBoundingClientRect();
        let x = 2 * (pageX * window.devicePixelRatio - r.left) / (this.props.width) - 1;
        let y = -2 * (pageY * window.devicePixelRatio - r.top) / (this.props.height) + 1;
        if (this.props.camera.showPerspective) {
            let cursor = [x * this.props.width / this.props.height * Math.tan(this.camera.fovy / 2), y * Math.tan(this.camera.fovy / 2), -1];
            let origin = vec3.transformMat4([], [0, 0, 0], this.camera.viewInv);
            let direction = vec3.sub([], vec3.transformMat4([], cursor, this.camera.viewInv), origin);
            return { origin, direction };
        } else {
            let cursor = vec3.transformMat4([], [x, y, -1], this.camera.viewInv);
            let origin = vec3.transformMat4([], [x, y, 0], this.camera.viewInv);
            let direction = vec3.sub([], cursor, origin);
            return { origin, direction };
        }
    }

    xyInterceptFromPoint(pageX, pageY) {
        let { origin, direction } = this.rayFromPoint(pageX, pageY);
        if (!direction[2])
            return;
        let t = -origin[2] / direction[2];
        return [origin[0] + t * direction[0], origin[1] + t * direction[1], 0];
    }

    hitTest(pageX, pageY) {
        if (!this.canvas || !this.drawCommands || !this.props.workspace.showDocuments)
            return;
        let result;
        this.hitTestFrameBuffer.resize(this.props.width, this.props.height);
        this.drawCommands.useFrameBuffer(this.hitTestFrameBuffer, () => {
            let { gl } = this.drawCommands;
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.BLEND);
            let r = ReactDOM.findDOMNode(this.canvas).getBoundingClientRect();
            let x = Math.round(pageX * window.devicePixelRatio - r.left);
            let y = Math.round(this.props.height - pageY * window.devicePixelRatio + r.top);
            if (x >= 0 && x < this.props.width && y >= 0 && y < this.props.height) {
                drawDocumentsHitTest(this.camera.perspective, this.camera.view, this.drawCommands, this.props.documentCacheHolder);
                let pixel = new Uint8Array(4);
                gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
                let hitTestId = (pixel[0] << 24) | (pixel[1] << 16) | (pixel[2] << 8) | pixel[3];
                for (let cachedDocument of this.props.documentCacheHolder.cache.values())
                    if (cachedDocument.hitTestId === hitTestId)
                        result = cachedDocument;
            }
        });
        return result;
    }

    zoom(pageX, pageY, amount) {
        let r = ReactDOM.findDOMNode(this.canvas).getBoundingClientRect();
        let camera = this.props.camera;
        let newFovy = Math.max(.1, Math.min(Math.PI - .1, camera.fovy * amount));
        let oldScale = vec3.distance(camera.eye, camera.center) * Math.tan(camera.fovy / 2) / (r.height / 2);
        let newScale = vec3.distance(camera.eye, camera.center) * Math.tan(newFovy / 2) / (r.height / 2);
        let dx = Math.round(pageX * window.devicePixelRatio - (r.left + r.right) / 2) * (newScale - oldScale);
        let dy = Math.round(-pageY * window.devicePixelRatio + (r.top + r.bottom) / 2) * (newScale - oldScale);
        let adjX = vec3.scale([], vec3.cross([], vec3.normalize([], vec3.sub([], camera.center, camera.eye)), camera.up), -dx);
        let adjY = vec3.scale([], camera.up, -dy);
        let adj = vec3.add([], adjX, adjY);
        this.props.dispatch(setCameraAttrs({
            eye: vec3.add([], camera.eye, adj),
            center: vec3.add([], camera.center, adj),
            fovy: newFovy,
        }));
    }

    onPointerDown(e) {
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        if (this.pointers.length && e.pointerType !== this.pointers[0].pointerType)
            this.pointers = [];
        this.pointers.push({ pointerId: e.pointerId, pointerType: e.pointerType, button: e.button, pageX: e.pageX, pageY: e.pageY, origPageX: e.pageX, origPageY: e.pageY });
        this.movingObjects = false;
        this.adjustingCamera = false;
        this.needToSelect = null;
        this.toggle = e.ctrlKey || e.shiftKey;
        this.liveJoggingKey = e.altKey || e.metaKey
        this.moveStarted = false;
        this.fingers = null;
        this.jogMode = this.props.mode == 'jog';

        if (LiveJogging.isEnabled() && this.liveJoggingKey && this.jogMode) {
            let [jogX, jogY] = this.xyInterceptFromPoint(e.pageX, e.pageY);
            let machineX = this.props.settings.machineBottomLeftX - this.props.workspace.workOffsetX;
            let machineY = this.props.settings.machineBottomLeftY - this.props.workspace.workOffsetY;
            jogX = Math.floor(clamp(jogX, machineX, this.props.settings.machineWidth - this.props.workspace.workOffsetX))
            jogY = Math.floor(clamp(jogY, machineY, this.props.settings.machineHeight - this.props.workspace.workOffsetY))
            let jogF = this.props.settings.jogFeedXY * ((this.props.settings.toolFeedUnits === 'mm/min') ? 1 : 60);
            CommandHistory.warn(`Live Jogging X${jogX} Y${jogY} F${jogF}`)
            return jogTo(jogX, jogY, undefined, 0, jogF)
        }

        let cachedDocument = this.hitTest(e.pageX, e.pageY);
        if (cachedDocument && e.button === 0 && !this.jogMode) {
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

    onPointerUp(e) {
        e.preventDefault();
        if (!this.pointers.length || e.pointerType !== this.pointers[0].pointerType)
            return;
        this.pointers = this.pointers.filter(x => x.pointerId !== e.pointerId);
        this.fingers = null;
        if (!this.pointers.length) {
            if (this.needToSelect) {
                if (this.toggle)
                    this.props.dispatch(toggleSelectDocument(this.needToSelect));
                else
                    this.props.dispatch(selectDocument(this.needToSelect));
            } else if (this.adjustingCamera && !this.moveStarted)
                this.props.dispatch(selectDocument(''));
        }
    }

    onPointerCancel(e) {
        e.preventDefault();
        this.pointers = this.pointers.filter(x => x.pointerId !== e.pointerId);
        this.fingers = null;
    }

    onPointerMove(e) {
        e.preventDefault();
        let pointer = this.pointers.find(x => x.pointerId === e.pointerId);
        if (!pointer)
            return;
        let dx = e.pageX - pointer.pageX;
        let dy = pointer.pageY - e.pageY;
        if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10)
            this.moveStarted = true;
        if (!this.moveStarted)
            return;
        if (this.movingObjects) {
            this.needToSelect = null;
            let p1 = this.xyInterceptFromPoint(e.pageX, e.pageY);
            let p2 = this.xyInterceptFromPoint(pointer.pageX, pointer.pageY);
            if (p1 && p2)
                this.props.dispatch(transform2dSelectedDocuments([1, 0, 0, 1, p1[0] - p2[0], p1[1] - p2[1]]));
            pointer.pageX = e.pageX;
            pointer.pageY = e.pageY;
        } else if (this.adjustingCamera) {
            let camera = this.props.camera;
            pointer.pageX = e.pageX;
            pointer.pageY = e.pageY;
            if (e.pointerType === 'touch' && this.pointers.length >= 2) {
                let centerX = this.pointers.reduce((acc, o) => acc + o.pageX, 0) / this.pointers.length;
                let centerY = this.pointers.reduce((acc, o) => acc + o.pageY, 0) / this.pointers.length;
                let distance = dist(
                    this.pointers[0].pageX, this.pointers[0].pageY,
                    this.pointers[1].pageX, this.pointers[1].pageY);
                if (this.fingers && this.fingers.num == this.pointers.length) {
                    if (this.pointers.length === 2) {
                        let d = distance - this.fingers.distance;
                        let origCenterX = this.pointers.reduce((acc, o) => acc + o.origPageX, 0) / this.pointers.length;
                        let origCenterY = this.pointers.reduce((acc, o) => acc + o.origPageY, 0) / this.pointers.length;
                        this.zoom(origCenterX, origCenterY, Math.exp(-d / 200));
                    } else if (this.pointers.length === 3) {
                        let dx = centerX - this.fingers.centerX;
                        let dy = centerY - this.fingers.centerY;
                        let rot = mat4.mul([],
                            mat4.fromRotation([], -dy / 100, vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center))),
                            mat4.fromRotation([], -dx / 100, camera.up));
                        this.props.dispatch(setCameraAttrs({
                            eye: vec3.add([], vec3.transformMat4([], vec3.sub([], camera.eye, camera.center), rot), camera.center),
                            up: vec3.normalize([], vec3.transformMat4([], camera.up, rot)),
                        }));
                    }
                }
                this.fingers = { num: this.pointers.length, centerX, centerY, distance };
            } else {
                this.fingers = null;
                if (pointer.button === 2) {
                    let rot = mat4.mul([],
                        mat4.fromRotation([], dy / 200, vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center))),
                        mat4.fromRotation([], -dx / 200, camera.up));
                    this.props.dispatch(setCameraAttrs({
                        eye: vec3.add([], vec3.transformMat4([], vec3.sub([], camera.eye, camera.center), rot), camera.center),
                        up: vec3.normalize([], vec3.transformMat4([], camera.up, rot)),
                    }));
                } else if (pointer.button === 1) {
                    this.zoom(pointer.origPageX, pointer.origPageY, Math.exp(-dy / 200));
                } else if (pointer.button === 0) {
                    let view = calcCamera({
                        viewportWidth: this.props.width,
                        viewportHeight: this.props.height,
                        fovy: camera.fovy,
                        near: .1,
                        far: 2000,
                        eye: [0, 0, vec3.distance(camera.eye, camera.center)],
                        center: [0, 0, 0],
                        up: [0, 1, 0],
                        showPerspective: false,
                        machineX: this.props.settings.machineBottomLeftX - this.props.workspace.workOffsetX,
                        machineY: this.props.settings.machineBottomLeftY - this.props.workspace.workOffsetY,
                    }).view;
                    let scale = 2 * window.devicePixelRatio / this.props.width / view[0];
                    dx *= scale;
                    dy *= scale;
                    let n = vec3.normalize([], vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center)));
                    this.props.dispatch(setCameraAttrs({
                        eye: vec3.add([], camera.eye,
                            vec3.add([], vec3.scale([], n, -dx), vec3.scale([], camera.up, -dy))),
                        center: vec3.add([], camera.center,
                            vec3.add([], vec3.scale([], n, -dx), vec3.scale([], camera.up, -dy))),
                    }));
                }
            }
        }
    }

    handleMouseEnter(e) {
        keyboardLogger.setContext('workspace')
    }

    handleMouseLeave(e) {
        keyboardLogger.setContext('global')
    }

    wheel(e) {
        e.preventDefault();
        this.zoom(e.pageX, e.pageY, Math.exp(e.deltaY / 2000));
    }

    contextMenu(e) {
        e.preventDefault();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.width !== this.props.width ||
            nextProps.height !== this.props.height ||
            nextProps.settings.machineWidth !== this.props.settings.machineWidth || nextProps.settings.machineHeight !== this.props.settings.machineHeight ||
            nextProps.settings.machineBottomLeftX !== this.props.settings.machineBottomLeftX || nextProps.settings.machineBottomLeftY !== this.props.settings.machineBottomLeftY ||
            nextProps.settings.toolGridWidth !== this.props.settings.toolGridWidth || nextProps.settings.toolGridHeight !== this.props.settings.toolGridHeight ||
            nextProps.workspace.workOffsetX !== this.props.workspace.workOffsetX || nextProps.workspace.workOffsetY !== this.props.workspace.workOffsetY ||
            nextProps.documents !== this.props.documents ||
            nextProps.camera !== this.props.camera ||
            nextProps.mode !== this.props.mode ||
            nextProps.workspace.cursorPos !== this.props.workspace.cursorPos
        );
    }

    render() {
        return (
            <div style={{ touchAction: 'none', userSelect: 'none' }} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                <Pointable tagName='div' touchAction="none"
                    onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove}
                    onPointerUp={this.onPointerUp} onPointerCancel={this.onPointerCancel}
                    onWheel={this.wheel} onContextMenu={this.contextMenu}>
                    <div className="workspace-content">
                        <canvas
                            style={{ width: this.props.width, height: this.props.height }}
                            width={Math.round(this.props.width)}
                            height={Math.round(this.props.height)}
                            ref={this.setCanvas} />
                    </div>
                    <Dom3d className="workspace-content workspace-overlay" camera={this.camera} width={this.props.width} height={this.props.height} settings={this.props.settings}>
                        <GridText {...{ width: this.props.settings.toolGridWidth, height: this.props.settings.toolGridHeight, minor: this.props.settings.toolGridMinorSpacing, major: this.props.settings.toolGridMajorSpacing }} />
                    </Dom3d>
                </Pointable>
                <div className="workspace-content workspace-overlay" style={{ zoom: window.devicePixelRatio }}>
                    <SetSize style={{ display: 'inline-block', pointerEvents: 'all' }}>
                        <FloatingControls
                            documents={this.props.documents} documentCacheHolder={this.props.documentCacheHolder} camera={this.camera}
                            workspaceWidth={this.props.width} workspaceHeight={this.props.height} dispatch={this.props.dispatch}
                            settings={this.props.settings}
                        />
                    </SetSize>
                </div>
                <div className={"workspace-content workspace-overlay " + this.props.mode}></div>
            </div>
        );
    }
} // WorkspaceContent

WorkspaceContent = connect(
    state => ({ settings: state.settings, documents: state.documents, camera: state.camera, workspace: state.workspace, mode: state.panes.selected })
)(withDocumentCache(WorkspaceContent));

class Workspace extends React.Component {
    componentWillMount() {
        this.gcodePreview = new GcodePreview();
        this.laserPreview = new LaserPreview();
        this.setSimTime = e => {
            let { workspace } = this.props;
            if (e.target.value >= this.gcodePreview.g1Time + this.gcodePreview.g0Dist / workspace.g0Rate - .00001)
                this.props.dispatch(setWorkspaceAttrs({ simTime: 1e10 }));
            else
                this.props.dispatch(setWorkspaceAttrs({ simTime: +e.target.value }));
        };
        this.zoomMachine = this.zoomMachine.bind(this);
        this.zoomDoc = this.zoomDoc.bind(this);
    }

    zoomMachine() {
        this.props.dispatch(zoomArea(
            this.props.settings.machineBottomLeftX - 10 - this.props.workspace.workOffsetX,
            this.props.settings.machineBottomLeftY - 10 - this.props.workspace.workOffsetY,
            this.props.settings.machineBottomLeftX + this.props.settings.machineWidth + 10 - this.props.workspace.workOffsetX,
            this.props.settings.machineBottomLeftY + this.props.settings.machineHeight + 10 - this.props.workspace.workOffsetY
        ));
    }

    zoomDoc() {
        let found = false;
        let bounds = this.bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
        for (let cache of this.props.documentCacheHolder.cache.values()) {
            let doc = cache.document;
            if (doc.selected && doc.transform2d && cache.bounds) {
                found = true;
                bounds.x1 = Math.min(bounds.x1, cache.bounds.x1 + doc.transform2d[4]);
                bounds.y1 = Math.min(bounds.y1, cache.bounds.y1 + doc.transform2d[5]);
                bounds.x2 = Math.max(bounds.x2, cache.bounds.x2 + doc.transform2d[4]);
                bounds.y2 = Math.max(bounds.y2, cache.bounds.y2 + doc.transform2d[5]);
            }
        }

        if (!found) {
            for (let cache of this.props.documentCacheHolder.cache.values()) {
                let doc = cache.document;
                if (doc.transform2d && cache.bounds) {
                    found = true;
                    bounds.x1 = Math.min(bounds.x1, cache.bounds.x1 + doc.transform2d[4]);
                    bounds.y1 = Math.min(bounds.y1, cache.bounds.y1 + doc.transform2d[5]);
                    bounds.x2 = Math.max(bounds.x2, cache.bounds.x2 + doc.transform2d[4]);
                    bounds.y2 = Math.max(bounds.y2, cache.bounds.y2 + doc.transform2d[5]);
                }
            }
        }

        if (found)
            this.props.dispatch(zoomArea(bounds.x1, bounds.y1, bounds.x2, bounds.y2));
    }

    render() {
        let { camera, gcode, workspace, setG0Rate, setShowPerspective, setShowGcode, setShowLaser, setShowDocuments, setShowWebcam, setRasterPreview, enableVideo } = this.props;
        if (this.gcode !== gcode) {
            this.gcode = gcode;
            let parsedGcode = parseGcode(gcode);
            this.gcodePreview.setParsedGcode(parsedGcode);
            this.laserPreview.setParsedGcode(parsedGcode);
        }
        return (
            <div id="workspace" className="full-height" style={this.props.style}>
                <SetSize id="workspace-top" style={{ zoom: 'reset' }}>
                    <WorkspaceContent gcodePreview={this.gcodePreview} laserPreview={this.laserPreview} />
                </SetSize>
                <div id="workspace-controls">
                    <div style={{ display: 'flex' }}>
                        <table>
                            <tbody>
                                <tr>
                                    <td colSpan='2'>
                                        <button className='btn btn-default' onClick={this.zoomMachine}><i className="fa fa-fw fa-search"></i>Mach</button>
                                        <button className='btn btn-default' onClick={this.zoomDoc}><i className="fa fa-fw fa-search"></i>Doc</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Perspective</td>
                                    <td><input checked={camera.showPerspective} onChange={setShowPerspective} type="checkbox" /></td>
                                </tr>
                                <tr>
                                    <td>Show Gcode</td>
                                    <td><input checked={workspace.showGcode} onChange={setShowGcode} type="checkbox" /></td>
                                </tr>
                                <tr>
                                    <td>Show Laser</td>
                                    <td><input checked={workspace.showLaser} onChange={setShowLaser} type="checkbox" /></td>
                                </tr>
                                <tr>
                                    <td>Show Documents</td>
                                    <td><input checked={workspace.showDocuments} onChange={setShowDocuments} type="checkbox" /></td>
                                </tr>
                                <tr>
                                    <td>Show Webcam</td>
                                    <td><input checked={workspace.showWebcam} disabled={!enableVideo} onChange={setShowWebcam} type="checkbox" /></td>
                                </tr>
                                <tr>
                                    <td>Show Raster Preview</td>
                                    <td><input checked={workspace.showRasterPreview} onChange={setRasterPreview} type="checkbox" /></td>
                                </tr>
                            </tbody>
                        </table>
                        <table style={{ marginLeft: 10 }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className='input-group'>
                                            <span className='input-group-addon'>Simulator</span>
                                            <input style={{ width: '250px' }} class='form-control' value={workspace.simTime} onChange={this.setSimTime} type="range" step="any" max={this.gcodePreview.g1Time + this.gcodePreview.g0Dist / workspace.g0Rate} is glyphicon="transfer" />
                                        </div>
                                        <div className='input-group'>
                                            <span className='input-group-addon'>Sim G0 Feed</span>
                                            <Input style={{ width: '85px' }} className='form-control' value={workspace.g0Rate} onChangeValue={setG0Rate} type="number" step="any" />
                                            <span className='input-group-addon'>mm/min</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <CommandHistory style={{ flexGrow: 1, marginLeft: 10 }} onCommandExec={runCommand} />
                    </div>
                </div>

                <VideoPort width={320} height={240} enabled={enableVideo && workspace.showWebcam} draggable="parent" />
                <ImagePort width={320} height={240} enabled={workspace.showRasterPreview} draggable="parent" />

            </div>
        )
    }
}
Workspace = connect(
    state => ({ camera: state.camera, gcode: state.gcode.content, workspace: state.workspace, settings: state.settings, enableVideo: (state.settings.toolVideoDevice !== null) }),
    dispatch => ({
        dispatch,
        setG0Rate: v => dispatch(setWorkspaceAttrs({ g0Rate: v })),
        setShowPerspective: e => dispatch(setCameraAttrs({ showPerspective: e.target.checked })),
        setShowGcode: e => dispatch(setWorkspaceAttrs({ showGcode: e.target.checked })),
        setShowLaser: e => dispatch(setWorkspaceAttrs({ showLaser: e.target.checked })),
        setShowDocuments: e => dispatch(setWorkspaceAttrs({ showDocuments: e.target.checked })),
        setShowWebcam: e => dispatch(setWorkspaceAttrs({ showWebcam: e.target.checked })),
        setRasterPreview: e => dispatch(setWorkspaceAttrs({ showRasterPreview: e.target.checked })),
        runCommand: () => dispatch(runCommand()),
    })
)(withDocumentCache(Workspace));
export default Workspace;
