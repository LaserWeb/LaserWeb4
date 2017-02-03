import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Draggable from 'react-draggable';
import Icon from './font-awesome'
import Select from 'react-select'
import { FormGroup, InputGroup, ControlLabel } from 'react-bootstrap'

import getUserMedia from 'getusermedia';
import { pipeImageCommand, barrelDistort, perspectiveDistort } from '../draw-commands/webcam'
import '../styles/webcam.css';


export class Webcam extends React.Component {

    componentWillUnmount() {
        this._stopVideo(this.stream);
    }

    componentDidMount() {
        this.initVideo(this.props);
        
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.resolution!=this.props.resolution){
            this._stopVideo(this.stream);
            this.initVideo(nextProps);
        }
        
    }

    initVideo(props) {

        let resolution=VIDEO_RESOLUTIONS[props.resolution];

        let streamNode= ReactDOM.findDOMNode(this).querySelector('#stream');
        this.video = document.createElement('video');   streamNode.append(this.video);
        this.video.width=resolution.width;
        this.video.height=resolution.height;
        this.video.style="display:none"
        this.canvas = document.createElement('canvas'); streamNode.append(this.canvas);
        

        this.canvas.width = this.video.width;
        this.canvas.height = this.video.height;

        

        // resolution adjustment
        const ratio = (value, index) => {
            let wh = !(index % 2) ? props.width : props.height;
            let rwh = !(index % 2) ? resolution.width : resolution.height;
            return parseInt((value / wh) * rwh);
        }

        // coordinates adjustment
        const swap = (set) => {
            return [
                set[0], props.height - set[1],
                set[2], props.height - set[3],
                set[4], props.height - set[5],
                set[6], props.height - set[7],
            ]
        }

        const capture = (src) => {
            const regl = require('regl')(this.canvas);
            const pipe = pipeImageCommand(regl)
            const fbopts = {
                width: resolution.width, height: resolution.height
            }
            
            const video =  regl.texture();
            const fbo =  regl.framebuffer(fbopts);
            const fbo2 =  regl.framebuffer(fbopts);

            delete(barrelDistort.COMMAND)
            delete(perspectiveDistort.COMMAND)

            const animate=()=>{
                    
                    try {

                        video({ data: src, min: 'linear', mag: 'linear' })
                        fbo(fbopts)
                        fbo2(fbopts)
                        
                        pipe({ src: video, dest: fbo })
                        if (this.props.lens || this.props.fov) {
                            barrelDistort(regl, fbo, fbo2, this.props.lens, this.props.fov)
                        } else {
                            pipe({ src: fbo, dest: fbo2 })
                        }

                        if (this.props.perspective) {
                            let {before, after} = this.props.perspective;
                            perspectiveDistort(regl, fbo2, null, swap(before).map(ratio), swap(after).map(ratio))
                        } else {
                            pipe({ src: fbo2 })
                        }
                        
                        requestAnimationFrame(animate)
                    } catch(e) {
                        
                    }
            }

            animate();            

            
                

        }

        let constraints = Object.assign({ video: true, audio: false }, props.constraints || {})
        if (props.device){
            constraints = Object.assign(constraints, {
                deviceId: { exact: props.device }, 
                width: {exact: resolution.width}, 
                height: {exact: resolution.height}
            });
        }
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
        this.video.addEventListener('loadeddata', (e) => {
            if (this.video.readyState === 4) {
                callback.apply(that, [this.video])
            }
        }, false)
        this.video.src = window.URL.createObjectURL(stream);
        this.video.play();
    };

    _stopVideo(stream) {
        if (stream) stream.getTracks().forEach((track) => { track.stop();});
        
        barrelDistort.COMMAND = null;
        perspectiveDistort.COMMAND = null;
        window.URL.revokeObjectURL(stream);

        let streamNode= ReactDOM.findDOMNode(this).querySelector('#stream');
            streamNode.removeChild(this.video);
            streamNode.removeChild(this.canvas);
        
        
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
    resolution: "720p(HD)",
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
                <Webcam width={this.props.width} height={this.props.height} 
                    perspective={{ before, after }} 
                    lens={this.props.lens} fov={this.props.fov} device={this.props.device} resolution={this.props.resolution} />
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

const VIDEO_RESOLUTIONS = {
     "4K(UHD)":     { "width" : 3840, "height": 2160, "ratio": "16:9" },
     "1080p(FHD)":  { "width": 1920, "height": 1080, "ratio": "16:9" },
     "UXGA":        { "width": 1600, "height": 1200, "ratio": "4:3" },
     "720p(HD)":    { "width": 1280, "height": 720, "ratio": "16:9" },
     "SVGA":        { "width": 800, "height": 600, "ratio": "4:3" },
     "VGA":         { "width": 640, "height": 480, "ratio": "4:3" },
     "360p(nHD)":   { "width": 640, "height": 360, "ratio": "16:9" },
     "CIF":         { "width": 352, "height": 288, "ratio": "4:3" },
     "QVGA":        { "width": 320, "height": 240, "ratio": "4:3" },
     "QCIF":        { "width": 176, "height": 144, "ratio": "4:3" },
     "QQVGA":       { "width": 160, "height": 120, "ratio": "4:3" }
};


const videoResolutionPromise=(deviceId, candidate)=>{
    const constraints={
        audio: false,
        video: {
                deviceId: deviceId ? {exact: deviceId} : undefined,
                width: {exact: candidate.width},    //new syntax
                height: {exact: candidate.height}   //new syntax
        }
    }

    return new Promise(
        (resolve) => {
                getUserMedia(constraints, (err, stream) => {
                    if (!err){
                        stream.getTracks().forEach((track) => { track.stop();});
                        resolve(candidate)
                    } 
                });
        }
    )
}

export class VideoResolutionField extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            resolutions:[], 
            selected: this.props.object[this.props.field] 
        }
        this.handleChange.bind(this)
    }

    getResolutions(deviceId){
        let videoPromises=Object.entries(VIDEO_RESOLUTIONS).map((entry)=>{ return videoResolutionPromise(deviceId, {label: entry[0], ...entry[1]}); } );
            videoPromises.forEach(
                (promise)=>promise.then((v)=>{ 
                    let resx=new Set(this.state.resolutions); resx.add(v)
                    this.setState({resolutions: [...resx]}) 
                })
            );
    }

    componentDidMount() {
        if (this.props.deviceId) 
            this.getResolutions(this.props.deviceId)
            
    }

    componentWillReceiveProps(nextProps)
    {
        if (nextProps.deviceId && nextProps.deviceId!==this.props.deviceId)
            this.getResolutions(nextProps.deviceId)
        
    }

    handleChange(v){
        this.setState({selected: v})
        this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }));
    }

    render() {
        let resolutions= this.state.resolutions.map((v)=>{return {label: `${v.label} (${v.width} x ${v.height}) / ${v.ratio}`, value: v.label}})
        return <FormGroup>
            <ControlLabel>{this.props.description}</ControlLabel>
            <Select options={resolutions} value={this.state.selected} clearable={false} disabled={!this.props.deviceId} onChange={(v)=>this.handleChange(v)} />
        </FormGroup>
    }
}


VideoResolutionField.defaultProps={
    description: 'Video Resolution'
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
VideoResolutionField = connect(null, (dispatch => { return { dispatch } }))(VideoResolutionField);
VideoControls = connect(null, (dispatch => { return { dispatch } }))(VideoControls);