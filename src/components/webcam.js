import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Draggable from 'react-draggable';
import Icon from './font-awesome'
import Select from 'react-select'
import { FormGroup, InputGroup, ControlLabel } from 'react-bootstrap'

import getUserMedia from 'getusermedia';
import { drawCommand, barrelDistort, perspectiveDistort } from '../draw-commands/webcam'
import '../styles/webcam.css';


export class Webcam extends React.Component {

    componentWillUnmount() {
        this._stopVideo(this.stream);
    }

    componentDidMount() {

        this.video = ReactDOM.findDOMNode(this).querySelector('#stream video');
        this.canvas = ReactDOM.findDOMNode(this).querySelector('#stream canvas');

        // resolution adjustment
        const ratio = (value, index) => {
            let wh = !(index % 2) ? this.props.width : this.props.height;
            let rwh = !(index % 2) ? this.props.resolution.width : this.props.resolution.height;
            return parseInt((value / wh) * rwh);
        }

        // coordinates adjustment
        const swap = (set) => {
            return [
                set[0], this.props.height - set[1],
                set[2], this.props.height - set[3],
                set[4], this.props.height - set[5],
                set[6], this.props.height - set[7],
            ]
        }

        const capture = (src) => {
            const regl = require('regl')(this.canvas);
            const pipe = drawCommand(regl)
            const fbopts = {
                width: this.props.resolution.width, height: this.props.resolution.height
            }



            this.loop = regl.frame(() => {
                try {
                    this.resources = {
                        video: regl.texture({ data: src, min: 'linear', mag: 'linear' }),
                        fbo: regl.framebuffer(fbopts),
                        fbo2: regl.framebuffer(fbopts),
                    }

                    pipe({ src: this.resources.video, dest: this.resources.fbo })

                    if (this.props.lens || this.props.fov) {
                        barrelDistort(regl, this.resources.fbo, this.resources.fbo2, this.props.lens, this.props.fov)
                    } else {
                        pipe({ src: this.resources.fbo, dest: this.resources.fbo2 })
                    }

                    if (this.props.perspective) {
                        let {before, after} = this.props.perspective;
                        perspectiveDistort(regl, this.resources.fbo2, null, swap(before).map(ratio), swap(after).map(ratio))
                    } else {
                        pipe({ src: this.resources.fbo2 })
                    }

                    this.resources.fbo.destroy(); this.resources.fbo = null
                    this.resources.fbo2.destroy(); this.resources.fbo2 = null;
                    this.resources.video.destroy(); this.resources.video = null;
                } catch (e) {
                    this.loop.cancel(); this.loop = null;
                    barrelDistort.COMMAND = null;
                    perspectiveDistort.COMMAND = null;
                }
            })

        }

        let constraints = Object.assign({ video: true, audio: false }, this.props.constraints || {})
        if (this.props.device)
            constraints = Object.assign(constraints, { deviceId: { exact: this.props.device }, mandatory: { minWidth: this.props.resolution.width, minHeight: this.props.resolution.height } })



        getUserMedia(constraints, (err, stream) => {
            if (err) {
                console.error(err);
            } else {
                this.stream = stream;
                this._startVideo(this.stream, capture)

            }
        })
    }

    _startVideo(stream, callback) {
        let that = this;
        this.video.src = window.URL.createObjectURL(stream);
        this.video.addEventListener('loadeddata', (e) => {
            if (this.video.readyState === 4) {
                callback.apply(that, [this.video])
            }
        }, false)

        this.video.play();
        this.canvas.width = this.video.width;
        this.canvas.height = this.video.height;

    };

    _stopVideo(stream) {
        try {
            if (this.loop) {
                this.loop.cancel();
                this.loop = null;
            }
            if (this.resources.video) {
                this.resources.video.destroy()
                this.resources.fbo = null
            }
            if (this.resources.fbo) {
                this.resources.fbo.destroy()
                this.resources.fbo = null
            }
            if (this.resources.fbo2) {
                this.resources.fbo2.destroy()
                this.resources.fbo2 = null
            }

            barrelDistort.COMMAND = null;
            perspectiveDistort.COMMAND = null;

        } catch (e) { }

        if (this.video)
            this.video.parentNode.removeChild(this.video);
        window.URL.revokeObjectURL(stream);
    }

    render() {
        return <div className="webcamViewport" style={{ width: this.props.width + "px", height: this.props.height + "px", overflow: "hidden" }}>
            <div id="stream">
                <video width={this.props.width} height={this.props.height} style={{ display: "none" }} />
                <canvas />
            </div>
        </div>
    }

}

Webcam.defaultProps = {
    width: 320,
    height: 240,
    resolution: { width: 1280, height: 720 },
    lens: { a: 1, b: 1, F: 4, scale: 1 },
    fov: { x: 1.0, y: 1.0 }
}

export class Coordinator extends React.Component {

    constructor(props) {
        super(props);
        this.state = { position: this.props.position.map(parseFloat) || [0, 0, 0, 0, 0, 0, 0, 0] }
        this.handleDrag.bind(this)
        this.handleStop.bind(this)
    }

    handleDrag(e, ui, index) {
        let position = Object.assign({}, this.state.position);
        position[index * 2] = position[index * 2] + ui.deltaX;
        position[index * 2 + 1] = position[index * 2 + 1] + ui.deltaY;
        this.setState({ position: position });

        if (this.props.onChange)
            this.props.onChange(position)
    }

    handleStop(e, ui, index) {
        if (this.props.onStop)
            this.props.onStop(this.state.position)
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ position: nextProps.position.map(parseFloat) })
    }

    render() {

        let dots = this.props.dots || ['red', 'green', 'blue', 'purple']
        let dotSize = this.props.dotSize || 10;
        let symbol = this.props.symbol || ((props) => { return <svg height="100%" width="100%"><circle r="50%" cx="50%" cy="50%" fill={props.fill} stroke="white" strokeWidth="1" /></svg> })

        return <div className="coordinator" style={{ width: this.props.width + "px", height: this.props.height + "px", position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
            {dots.map((fill, i) => {
                return <Draggable onStop={(e, ui) => { this.handleStop(e, ui, i) }} onDrag={(e, ui) => this.handleDrag(e, ui, i)} key={i} position={{ x: this.state.position[i * 2], y: this.state.position[i * 2 + 1] }} bounds="parent">
                    <div className="symbol" style={{ cursor: "move", marginTop: -dotSize / 2, marginLeft: -dotSize / 2, width: dotSize, height: dotSize }}>{symbol({ fill })}</div>
                </Draggable>
            })}
        </div >
    }
}

const getDefaultPerspective = (p, w=0, h=0) => {
    return {
        before: (p && p.before) ? p.before : [
            w * 0.2, h * 0.8,
            w * 0.8, h * 0.8,
            w * 0.8, h * 0.2,
            w * 0.2, h * 0.2
        ],
        after: (p && p.after) ? p.after : [
            w * 0.2, h * 0.8,
            w * 0.8, h * 0.8,
            w * 0.8, h * 0.2,
            w * 0.2, h * 0.2
        ],
    }
}

export class PerspectiveWebcam extends React.Component {

    constructor(props) {
        super(props);
        let w = this.props.width;
        let h = this.props.height;
        let p = this.props.perspective;

        this.state = getDefaultPerspective(p, w, h);
        this.handlePerspectiveChange.bind(this)
        this.handleStop.bind(this)
    }

    handlePerspectiveChange(position, key) {
        this.setState({ [key]: Object.values(position) })
    }

    handleStop() {
        if (this.props.onStop)
            this.props.onStop(this.state);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ ...nextProps.perspective })
    }

    componentDidMount()
    {
        this.handleStop();
    }

    render() {

        let {before, after} = this.state;

        return <div className="perspectiveWebcam">
            <div className="viewPort">
                <Webcam width={this.props.width} height={this.props.height} perspective={{ before, after }} lens={this.props.lens} fov={this.props.fov} device={this.props.device} />
                {this.props.showCoordinators ? (<Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handlePerspectiveChange(position, "before") }}
                    onStop={(position) => { this.handleStop() }}
                    position={this.state.before}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    symbol={
                        (props) => { return <svg height="100%" width="100%"><rect x="0" y="0" width="10" height="10" fill={props.fill} stroke="white" strokeWidth="1" /></svg> }
                    }
                />) : undefined}
                {this.props.showCoordinators ? (<Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handlePerspectiveChange(position, "after") }}
                    onStop={(position) => { this.handleStop() }}
                    position={this.state.after}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                />) : undefined}
            </div>
        </div>
    }

}
PerspectiveWebcam.defaultProps = {
    showCoordinators: true
}

export class VideoDeviceField extends React.Component {

    constructor(props) {
        super(props);
        this.state = { devices: [] }
    }

    componentDidMount() {
        let promise = navigator.mediaDevices.enumerateDevices();
        let that = this;
        promise.then((devices) => {
            let cameras = [];
            devices.forEach((device) => {
                if (device.kind == 'videoinput')
                    cameras.push({ label: device.label, value: device.deviceId })
            })
            cameras.unshift({ label: "None", value: null })
            that.setState({ devices: cameras })
        })
            .catch(function (err) {
                console.error(err.name + ": " + err.message);
            });
    }

    render() {
        return <FormGroup>
            <ControlLabel>{this.props.description}</ControlLabel>
            <Select options={this.state.devices} value={this.props.object[this.props.field]} onChange={(v) => this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }, this.props.object.id))} clearable={false} />
        </FormGroup>
    }


}


export class VideoControls extends React.Component {

    constructor(props) {
        super(props)
        this.handleChange.bind(this)
        this.handlePerspective.bind(this)
        this.state = {
            lens: this.props.lens,
            fov: this.props.fov,
            perspective: getDefaultPerspective(this.props.perspective, this.props.videoWidth, this.props.videoHeight)
        }
    }

    handleChange(e, key, prop) {
        let state = { ...this.state };
        state[key][prop] = e.target.value;
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);

    }

    handlePerspective(key, index, value) {
        let state = Object.assign({}, this.state);
        let position = this.state.perspective[key].slice();
        position[index] = parseFloat(value);
        state.perspective[key] = position;
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            lens: nextProps.lens,
            fov: nextProps.fov,
            perspective: getDefaultPerspective(nextProps.perspective, nextProps.videoWidth, nextProps.videoHeight)
        })
    }

    render() {

        let {before, after} = this.state.perspective;
        return <div className="videoControls ">
            <table width="100%" className="table table-compact">
                <tbody>
                    <tr><th>Before</th>
                        {before.map((value, i) => {
                            return <td key={i}>{(i % 2 === 0) ? "X" : "Y"}{Math.floor(i / 2)}<input type="number" size="4" value={value} onChange={e => { this.handlePerspective('before', i, e.target.value) }} step="any" /></td>
                        })}
                    </tr>
                    <tr><th>After</th>
                        {after.map((value, i) => {
                            return <td key={i}>{(i % 2 === 0) ? "X" : "Y"}{Math.floor(i / 2)}<input type="number" size="4" value={value} onChange={e => { this.handlePerspective('after', i, e.target.value) }} step="any" /></td>
                        })}
                    </tr>
                </tbody>
            </table>
            <table width="100%" className="table table-compact">
                <tbody>
                    <tr>
                        <th>a</th>
                        <td><input type="number" step="any" value={parseFloat(this.props.lens.a)} onChange={(e) => { this.handleChange(e, "lens", "a"); }} /></td>
                        <td width="100%"><input className="form-control" value={parseFloat(this.props.lens.a)} onChange={(e) => { this.handleChange(e, "lens", "a"); }} type="range" min="0" max="4" step="any" />    </td>
                    </tr>
                    <tr>
                        <th>b</th>
                        <td><input type="number" step="any" value={parseFloat(this.props.lens.b)} onChange={(e) => { this.handleChange(e, "lens", "b"); }} /></td>
                        <td width="100%"><input className="form-control" value={parseFloat(this.props.lens.b)} onChange={(e) => { this.handleChange(e, "lens", "b"); }} type="range" min="0" max="4" step="any" /></td>
                    </tr>
                    <tr>
                        <th>F</th>
                        <td><input type="number" step="any" value={parseFloat(this.props.lens.F)} onChange={(e) => { this.handleChange(e, "lens", "F"); }} /> </td>
                        <td width="100%"><input className="form-control" value={parseFloat(this.props.lens.F)} onChange={(e) => { this.handleChange(e, "lens", "F"); }} type="range" min="-1" max="4" step="any" />  </td>
                    </tr>
                    <tr>
                        <th>scale</th>
                        <td><input type="number" step="any" value={parseFloat(this.props.lens.scale)} onChange={(e) => { this.handleChange(e, "lens", "scale"); }} /> </td>
                        <td width="100%"><input className="form-control" value={parseFloat(this.props.lens.scale)} onChange={(e) => { this.handleChange(e, "lens", "scale"); }} type="range" min="0" max="20" step="any" /> </td>
                    </tr>
                </tbody>
            </table>
        </div>
    }

}

VideoControls.defaultProps={
    perspective: { before: [0, 0, 0, 0, 0, 0, 0, 0], after: [0, 0, 0, 0, 0, 0, 0, 0] }
}

Webcam = connect()(Webcam);
Coordinator = connect()(Coordinator);
PerspectiveWebcam = connect(null, (dispatch => { return { dispatch } }))(PerspectiveWebcam);
VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoControls = connect(null, (dispatch => { return { dispatch } }))(VideoControls);