import { mat4, vec3, vec4 } from 'gl-matrix';
import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom';

import { setCameraAttrs } from '../actions/camera'
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
        this.mouseUp = this.mouseUp.bind(this);
        this.mouseLeave = this.mouseLeave.bind(this);
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

            let oldCache = this.documentCache;
            this.documentCache = [];

            drawCommands.camera({ perspective: this.camera.perspective, world: this.camera.world, }, () => {
                this.grid.draw(drawCommands, { width: this.props.settings.machineWidth, height: this.props.settings.machineHeight });

                let cachePos = 0;
                let f = document => {
                    while (cachePos < oldCache.length && oldCache[cachePos].id !== document.id)
                        ++cachePos;
                    let cache;
                    if (cachePos < oldCache.length)
                        cache = oldCache[cachePos];
                    else
                        cache = { id: document.id };
                    this.documentCache.push(cache);

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
                    } else {
                        for (let c of document.children)
                            f(this.props.documents.find(d => d.id === c));
                    }
                }
                for (let d of this.props.documents)
                    if (d.type === 'document')
                        f(d);
            });
        })
    }

    componentWillReceiveProps(nextProps) {
        this.camera =
            perspectiveCamera({
                viewportWidth: nextProps.width,
                viewportHeight: nextProps.height,
                fovy: Math.PI / 2,
                near: .1,
                far: 1000,
                eye: nextProps.camera.eye,
                center: nextProps.camera.center,
                up: nextProps.camera.up,
            });
    }

    mouseDown(e) {
        this.mouseIsDown = true;
        this.mouseButton = e.button;
        this.mouseX = e.screenX;
        this.mouseY = e.screenY;
    }

    mouseUp(e) {
        if (this.mouseButton === e.button)
            this.mouseIsDown = false;
    }

    mouseLeave(e) {
        this.mouseIsDown = false;
    }

    mouseMove(e) {
        if (!this.mouseIsDown)
            return;
        let dx = e.screenX - this.mouseX;
        let dy = this.mouseY - e.screenY;
        let camera = this.props.camera;
        if (this.mouseButton === 0) {
            let rot =
                mat4.mul([],
                    mat4.fromXRotation([], dy / 200),
                    mat4.fromYRotation([], -dx / 200));
            this.props.dispatch(setCameraAttrs({
                eye: vec3.add([], vec3.transformMat4([], vec3.sub([], camera.eye, camera.center), rot), camera.center),
                up: vec3.normalize([], vec3.transformMat4([], camera.up, rot)),
            }));
        } else if (this.mouseButton === 1) {
            this.props.dispatch(setCameraAttrs({
                eye: vec3.add([], vec3.scale([], vec3.sub([], camera.eye, camera.center), Math.exp(-dy / 100)), camera.center),
            }));
        } else if (this.mouseButton === 2) {
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
            eye: vec3.add([], vec3.scale([], vec3.sub([], camera.eye, camera.center), Math.exp(e.deltaY / 1000)), camera.center),
        }));
    }

    contextMenu(e) {
        e.preventDefault();
    }

    render() {
        return (
            <div
                className="workspace-content" onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseLeave={this.mouseLeave}
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
            </div>
        );
    }
} // WorkspaceContent

WorkspaceContent = connect(
    state => ({ settings: state.settings, documents: state.documents, camera: state.camera })
)(WorkspaceContent);

export default class Workspace extends React.Component {
    render() {
        return (
            <div id="workspace" className="full-height">
                <SetSize id="workspace-top" style={{ zoom: 'reset' }}>
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
