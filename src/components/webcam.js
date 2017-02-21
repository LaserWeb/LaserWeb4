import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Draggable from 'react-draggable';
import Icon from './font-awesome'
import Select from 'react-select'
import Toggle from 'react-toggle'
import { FormGroup, InputGroup, ControlLabel, Button } from 'react-bootstrap'

import { pipeImageCommand, barrelDistortCommand, perspectiveDistortCommand, computePerspectiveMatrix } from '../draw-commands/webcam'
import '../styles/webcam.css';

import { DEFAULT_VIDEO_RESOLUTION, VIDEO_RESOLUTIONS, videoResolutionPromise, getSizeByVideoResolution, getVideoResolution } from '../lib/video-capture'

export class Webcam extends React.Component {


    componentDidMount() {
        this.initVideo(false)
    }

    componentWillUnmount() {
        let streamNode = ReactDOM.findDOMNode(this).querySelector('#stream');
        streamNode.removeChild(this.canvas);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.resolution != this.props.resolution) {
            this.initVideo(true);
        }
    }

    initVideo(force = false) {

        let resolution = getVideoResolution(this.props.resolution);
        let videoratio = resolution.ratio.split(":"); videoratio = videoratio[0] / videoratio[1];
        let streamNode = ReactDOM.findDOMNode(this).querySelector('#stream');


        if (this.canvas)
            streamNode.removeChild(this.canvas);
        this.canvas = document.createElement('canvas');

        streamNode.append(this.canvas);


        // coords resolution adjustment
        const ratio = (value, index) => {
            let wh = !(index % 2) ? this.props.width : this.props.height;
            let rwh = !(index % 2) ? resolution.width : resolution.height;
            return parseInt((value / wh) * rwh);
        }

        // coords order adjustment
        const swap = (set) => {
            return [
                set[0], this.props.height - set[1],
                set[2], this.props.height - set[3],
                set[4], this.props.height - set[5],
                set[6], this.props.height - set[7],
            ]
        }

        const capture = (src) => {

            this.video = src;


            this.canvas.width = src.width;
            this.canvas.height = src.height;

            const regl = require('regl')(this.canvas);
            const pipe = pipeImageCommand(regl)

            const barrelDistort = barrelDistortCommand(regl)
            const perspectiveDistort = perspectiveDistortCommand(regl)

            const fbopts = {
                width: resolution.width, height: resolution.height
            }

            const video = regl.texture();
            const fbo = regl.framebuffer(fbopts);
            const fbo2 = regl.framebuffer(fbopts);

            const animate = () => {
                if (!window.videoCapture.isReady)
                    return;
                try {
                    video({ data: this.video, min: 'linear', mag: 'linear' })
                    fbo(fbopts)
                    fbo2(fbopts)

                    pipe({ src: video, dest: fbo })

                    if (this.props.lens || this.props.fov) {
                        let lens = (this.props.lens) ? [this.props.lens.a, this.props.lens.b, this.props.lens.F, this.props.lens.scale] : [1.0, 1.0, 1.0, 1.5]
                        let fov = this.props.fov ? this.props.fov : [1.0, 1.0];
                        barrelDistort({ src: fbo, dest: fbo2, lens, fov })
                    } else {
                        pipe({ src: fbo, dest: fbo2 })
                    }

                    if (this.props.perspective) {
                        let {before, after} = this.props.perspective;
                        let matrix = computePerspectiveMatrix(video, swap(before).map(ratio), swap(after).map(ratio));

                        perspectiveDistort({ src: fbo2, dest: null, size: [video.width, video.height], matrix })
                    } else {
                        pipe({ src: fbo2, dest: null })
                    }

                    requestAnimationFrame(animate)
                } catch (e) {
                    console.error(e)
                }
            }

            animate();

        }


        window.videoCapture.getVideo(this.props, capture)
    }

    render() {
        return <div className="webcamViewport" style={{ maxWidth: "100%", height: "auto", overflow: "hidden" }}>
            <div id="stream"></div>
        </div>
    }

}

Webcam.defaultProps = {
    width: 320,
    height: 240,
    resolution: DEFAULT_VIDEO_RESOLUTION,
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
        let symbol = this.props.symbol || ((props) => { return <svg height="100%" width="100%" style={{ position: "absolute", left: 0, top: 0 }}><circle r="50%" cx="50%" cy="50%" fill={props.fill} stroke="white" strokeWidth="1" /></svg> })

        return <div className="coordinator" style={{ width: this.props.width + "px", height: this.props.height + "px", position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
            {dots.map((fill, i) => {
                return <Draggable onStop={(e, ui) => { this.handleStop(e, ui, i) }} onDrag={(e, ui) => this.handleDrag(e, ui, i)} key={i} position={{ x: this.state.position[i * 2], y: this.state.position[i * 2 + 1] }} bounds="parent">
                    <div className="symbol" style={{ position: "absolute", left: 0, top: 0, cursor: "move", marginTop: -dotSize / 2, marginLeft: -dotSize / 2, width: dotSize, height: dotSize }}>{symbol({ fill })}</div>
                </Draggable>
            })}
        </div >
    }
}

const getDefaultPerspective = (p, w = 0, h = 0) => {
    return Object.assign(p, {
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
    })
}



export class PerspectiveWebcam extends React.Component {

    constructor(props) {
        super(props);
        let p = this.props.perspective || {};
        let { width, height } = getSizeByVideoResolution(this.props.height, this.props.resolution);
        this.state = getDefaultPerspective(p, width, height);
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

    componentDidMount() {
        this.handleStop();
    }

    render() {

        let { before, after, enabled } = this.state;
        let { width, height } = getSizeByVideoResolution(this.props.height, this.props.resolution);

        return <div className="perspectiveWebcam">
            <div className="viewPort">
                <Webcam width={width} height={height}
                    perspective={enabled ? { before, after } : undefined}
                    lens={this.props.lens} fov={this.props.fov} device={this.props.device} resolution={this.props.resolution} />
                {this.props.showCoordinators ? (<Coordinator width={width} height={height}
                    onChange={(position) => { this.handlePerspectiveChange(position, "before") }}
                    onStop={(position) => { this.handleStop() }}
                    position={this.state.before}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    symbol={
                        (props) => { return <svg height="100%" width="100%" style={{ position: "absolute", left: 0, top: 0 }}><rect x="0" y="0" width="10" height="10" fill={props.fill} stroke="white" strokeWidth="1" /></svg> }
                    }
                />) : undefined}
                {this.props.showCoordinators ? (<Coordinator width={width} height={height}
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
        this.handleSelection.bind(this)
    }

    componentDidMount() {
        window.videoCapture.getDevices((devices) => { this.setState({ devices }) })
    }

    handleSelection(v) {
        if (!v.value) window.videoCapture.stopStream();
        this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }, this.props.object.id))
    }

    render() {
        return <FormGroup>
            <ControlLabel>{this.props.description}</ControlLabel>
            <Select options={this.state.devices} value={this.props.object[this.props.field]} onChange={(v) => this.handleSelection(v)} clearable={false} />
        </FormGroup>
    }

}



export class VideoResolutionField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resolutions: window.videoCapture.data.resolutions || [],
            isLoading: false
        }
        this.handleChange.bind(this)
    }

    getResolutions(deviceId) {
        if (deviceId) {
            this.setState({ isLoading: true })
            window.videoCapture.scan(deviceId, null, (props) => {
                let {resolutions, resolutionId} = props;
                console.log("refreshing resolutions...")
                this.setState({ resolutions, isLoading:false, selected: resolutionId })
                this.handleChange({value:resolutionId})
            })
        } else {
            this.setState({ resolutions: [] })
            this.handleChange({value:null})
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.deviceId !== this.props.deviceId) {
            this.getResolutions(nextProps.deviceId)
        }
    }

    handleChange(v) {
        this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }));
    }

    render() {
        let resolutions = this.state.resolutions.map((v) => { return { label: `${v.label} (${v.width} x ${v.height}) / ${v.ratio}`, value: v.label } })
        let selected = this.props.object[this.props.field];
        return <FormGroup>
            <ControlLabel>{this.props.description}</ControlLabel>
            <Select isLoading={this.state.isLoading} options={resolutions} value={selected} clearable={false} disabled={!this.props.deviceId} onChange={(v) => this.handleChange(v)} />
        </FormGroup>
    }
}


VideoResolutionField.defaultProps = {
    description: 'Video Resolution'
}


export class VideoControls extends React.Component {

    constructor(props) {
        super(props)
        this.handleChange.bind(this)
        this.handlePerspectiveCoord.bind(this)
        this.handlePerspectiveReset.bind(this)
        this.handlePerspectiveToggle.bind(this)

        let {width, height} = getSizeByVideoResolution(this.props.videoHeight, this.props.resolution)


        this.state = {
            lens: this.props.lens,
            fov: this.props.fov,
            perspective: { enabled: false, ...getDefaultPerspective(this.props.perspective || {}, width, height) },
        }
    }

    handleChange(e, key, prop) {
        let state = { ...this.state };
        state[key][prop] = e.target.value;
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);

    }

    handlePerspectiveCoord(key, index, value) {
        let state = Object.assign({}, this.state);
        state.perspective[key][index] = parseFloat(value);
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);
    }

    handlePerspectiveReset() {
        let {width, height} = getSizeByVideoResolution(this.props.videoHeight, this.props.resolution)

        let state = Object.assign({}, this.state);
        state.perspective = Object.assign(state.perspective, getDefaultPerspective({}, width, height))

        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);
    }

    handlePerspectiveToggle() {
        let state = Object.assign({}, this.state);
        state.perspective.enabled = !state.perspective.enabled
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);
    }

    componentWillReceiveProps(nextProps) {
        let {width, height} = getSizeByVideoResolution(nextProps.videoHeight, nextProps.resolution)
        this.setState({
            lens: nextProps.lens,
            fov: nextProps.fov,
            perspective: { enabled: false, ...getDefaultPerspective(nextProps.perspective || {}, width, height) }
        })
    }

    render() {

        let {before, after, enabled} = this.state.perspective;
        return <div className="videoControls ">
            <table width="100%" className="table table-compact">
                <caption>Perspective</caption>
                <tbody>
                    <tr>
                        <th>Enable</th><td colSpan="2"><Toggle checked={enabled} onChange={e => this.handlePerspectiveToggle(e)} /></td><td colSpan="6"><Button bsStyle="warning" onClick={e => this.handlePerspectiveReset()}>Reset</Button></td>
                    </tr>
                    <tr><th>Before</th>
                        {before.map((value, i) => {
                            return <td key={i}>{(i % 2 === 0) ? "X" : "Y"}{Math.floor(i / 2)}<input type="number" size="4" value={value} onChange={e => { this.handlePerspectiveCoord('before', i, e.target.value) }} step="any" /></td>
                        })}
                    </tr>
                    <tr><th>After</th>
                        {after.map((value, i) => {
                            return <td key={i}>{(i % 2 === 0) ? "X" : "Y"}{Math.floor(i / 2)}<input type="number" size="4" value={value} onChange={e => { this.handlePerspectiveCoord('after', i, e.target.value) }} step="any" /></td>
                        })}
                    </tr>
                </tbody>
            </table>
            <table width="100%" className="table table-compact">
                <caption>Lens</caption>
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

VideoControls.defaultProps = {
    perspective: { before: [0, 0, 0, 0, 0, 0, 0, 0], after: [0, 0, 0, 0, 0, 0, 0, 0] },
    resolution: '720p(HD)'
}

Webcam = connect()(Webcam);
Coordinator = connect()(Coordinator);
PerspectiveWebcam = connect(null, (dispatch => { return { dispatch } }))(PerspectiveWebcam);
VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoResolutionField = connect(null, (dispatch => { return { dispatch } }))(VideoResolutionField);
VideoControls = connect(null, (dispatch => { return { dispatch } }))(VideoControls);