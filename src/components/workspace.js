import { mat4 } from 'gl-matrix';
import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom';

import SetSize from './setsize';
import { Dom3d, Text3d } from './dom3d';
import DrawCommands from '../draw-commands'
import { triangulatePositions } from '../lib/mesh';

function simpleCamera({viewportWidth, viewportHeight}) {
    let perspective = mat4.identity([]);
    let world = mat4.identity([]);
    world[0] = 8 / viewportWidth;
    world[5] = 8 / viewportHeight;
    world[12] = -.8;
    world[13] = -.9;
    return { perspective, world };
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
                        drawCommands.simple({
                            position: cache.triangles,
                            color: [0, 1, 1, 1],
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
            simpleCamera({
                viewportWidth: nextProps.width * window.devicePixelRatio,
                viewportHeight: nextProps.height * window.devicePixelRatio,
            });
    }

    render() {
        return (
            <div className="workspace-content">
                <div className="workspace-content">
                    <canvas
                        style={{ width: this.props.width, height: this.props.height }}
                        width={Math.round(this.props.width * window.devicePixelRatio)}
                        height={Math.round(this.props.height * window.devicePixelRatio)}
                        ref={this.setCanvas} />
                </div>
                <Dom3d className="workspace-content workspace-overlay" camera={this.camera} width={this.props.width} height={this.props.height}>
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
