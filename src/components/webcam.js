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


        const ratio = (value, index) => {
            let wh = !(index % 2) ? this.props.width : this.props.height;
            let rwh = !(index % 2) ? this.props.resolution.width : this.props.resolution.height;
            return parseInt((value / wh) * rwh);
        }

        const capture = () => {
            const regl = require('regl')(this.canvas);
            const pipe = drawCommand(regl)

            this.loop = regl.frame(() => {
                try {
                    const video = regl.texture(this.video); video.mipmap = 'nice'
                    const fbo = regl.framebuffer({ width: this.props.resolution.width, height: this.props.resolution.height })
                    const fbo2 = regl.framebuffer({ width: this.props.resolution.width, height: this.props.resolution.height })
                    video(this.video)

                    pipe({ src: video, dest: fbo })
                    
                    if (this.props.lens || this.props.fov) {
                        barrelDistort(regl, fbo, fbo2, this.props.lens, this.props.fov)
                    } else {
                        pipe({ src: fbo, dest: fbo2 })
                    }

                    if (this.props.perspective) {
                        let {before, after} = this.props.perspective;
                        perspectiveDistort(regl, fbo2, null, before.map(ratio), after.map(ratio))
                    } else {
                        pipe({ src: fbo2 })
                    }
                    
                    fbo.destroy();
                    fbo2.destroy();
                    video.destroy();
                } catch(e) {
                    this.loop.cancel();
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
                callback.apply(that)
            }
        }, false)

        this.video.play();
        this.canvas.width = this.video.width;
        this.canvas.height = this.video.height;

    };

    _stopVideo(stream) {
        try {
            if (this.loop) this.loop.cancel();
        } catch(e){}
        
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
        this.state = { position: this.props.position || [0, 0, 0, 0, 0, 0, 0, 0] }
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

    render() {

        let dots = this.props.dots || ['red', 'green', 'blue', 'purple']
        let dotSize = this.props.dotSize || 10;
        let symbol = this.props.symbol || ((props) => { return <svg height="100%" width="100%"><circle r="50%" cx="50%" cy="50%" fill={props.fill} stroke="white" strokeWidth="1" /></svg> })

        return <div className="coordinator" style={{ width: this.props.width + "px", height: this.props.height + "px", position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
            {dots.map((fill, i) => {
                return <Draggable onStop={(e, ui) => { this.handleStop(e, ui, i) } } onDrag={(e, ui) => this.handleDrag(e, ui, i)} key={i} position={{ x: this.state.position[i * 2], y: this.state.position[i * 2 + 1] }} bounds="parent">
                    <div className="symbol" style={{ cursor: "move", marginTop: -dotSize / 2, marginLeft: -dotSize / 2, width: dotSize, height: dotSize }}>{symbol({ fill })}</div>
                </Draggable>
            })}
        </div >
    }
}

export class PerspectiveWebcam extends React.Component {

    constructor(props) {
        super(props);
        let w = this.props.width;
        let h = this.props.height;
        let p = this.props.perspective;

        this.state = {
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

    render() {

        let before = this.state.before;
        let after = this.state.after;

        return <div className="perspectiveWebcam">
            <div className="viewPort">
                <Webcam width={this.props.width} height={this.props.height} perspective={{ before, after }} lens={this.props.lens} fov={this.props.fov} device={this.props.device} />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handlePerspectiveChange(position, "before") } }
                    onStop={(position) => { this.handleStop() } }
                    position={this.state.before}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    symbol={
                        (props) => { return <svg height="100%" width="100%"><rect x="0" y="0" width="10" height="10" fill={props.fill} stroke="white" strokeWidth="1" /></svg> }
                    }
                    />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handlePerspectiveChange(position, "after") } }
                    onStop={(position) => { this.handleStop() } }
                    position={this.state.after}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    />
            </div>
        </div>
    }

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


export class VideoControls extends React.Component{

    constructor(props){
        super(props)
        this.handleChange.bind(this)
        this.state={
            lens:this.props.lens,
            fov: this.props.fov,
        }
    }

    handleChange(e,key,prop){
        let state={...this.state};
            state[key][prop]= e.target.value;
        this.setState(state)
        if (this.props.onChange)
            this.props.onChange(state);
        
    }

    render(){
        return <FormGroup className="videoControls">
            
            <InputGroup><InputGroup.Addon>a</InputGroup.Addon>        <input className="form-control" value={this.props.lens.a} onChange={(e)=>{this.handleChange(e, "lens","a");}} type="range"  min="0" max="4" step="any"/></InputGroup>
            <InputGroup><InputGroup.Addon>b</InputGroup.Addon>        <input className="form-control" value={this.props.lens.b} onChange={(e)=>{this.handleChange(e, "lens","b");}} type="range"  min="0" max="4" step="any"/></InputGroup>
            <InputGroup><InputGroup.Addon>F</InputGroup.Addon>        <input className="form-control" value={this.props.lens.f} onChange={(e)=>{this.handleChange(e, "lens","F");}} type="range"  min="0" max="4" step="any" /></InputGroup>
            <InputGroup><InputGroup.Addon>scale</InputGroup.Addon>    <input className="form-control" value={this.props.lens.scale} onChange={(e)=>{this.handleChange(e, "lens","scale");}} type="range"  min="0" max="20" step="any"/></InputGroup>
            <InputGroup><InputGroup.Addon>Fov X</InputGroup.Addon>    <input className="form-control" value={this.props.fov.x} onChange={(e)=>{this.handleChange(e, "fov","x");}} type="range"  min="0" max="2" step="any" /></InputGroup>
            <InputGroup><InputGroup.Addon>Fov Y </InputGroup.Addon>   <input className="form-control" value={this.props.fov.y} onChange={(e)=>{this.handleChange(e, "fov","y");}} type="range"  min="0" max="2" step="any" /></InputGroup>
        </FormGroup>
    }

}

Webcam = connect()(Webcam);
Coordinator = connect()(Coordinator);
PerspectiveWebcam = connect(null, (dispatch => { return { dispatch } }))(PerspectiveWebcam);
VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoControls = connect(null, (dispatch => { return { dispatch } }))(VideoControls);