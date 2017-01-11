import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import getUserMedia from 'getusermedia';
import fx from 'glfx'
import '../styles/webcam.css';

import Draggable from 'react-draggable';
import Icon from './font-awesome'

import Select from 'react-select'
import { FormGroup, InputGroup, ControlLabel } from 'react-bootstrap'

export class Webcam extends React.Component {

    componentWillUnmount() {
        this._stopVideo(this.stream);
    }

    componentDidMount() {
        this.canvas = new fx.canvas();
        this.video = ReactDOM.findDOMNode(this).querySelector('#stream video');

        ReactDOM.findDOMNode(this).appendChild(this.canvas)

        const capture = () => {
            let texture = this.canvas.texture(this.video)
            texture.loadContentsOf(this.video);

            this.canvas.draw(texture);

            if (this.props.perspective) {
                let {before, after} = this.props.perspective;
                if (before && after)
                    this.canvas.perspective(before, after)
            }

            this.canvas.update();

            requestAnimationFrame(capture);

        }

        let constraints = Object.assign({ video: true, audio: false }, this.props.constraints || {})
        if (this.props.device)
            constraints = Object.assign(constraints, { deviceId: { exact: this.props.device } })


        getUserMedia(constraints, (err, stream) => {
            if (err) {
                console.error(err);
            } else {
                this.stream = stream;
                this._startVideo(this.stream)
                capture()
            }

        })
    }

    _startVideo(stream) {
        this.video.src = window.URL.createObjectURL(stream);
        this.video.play();
        this.canvas.width = this.video.width;
        this.canvas.height = this.video.height;
    };

    _stopVideo(stream) {
        if (this.video)
            this.video.parentNode.removeChild(this.video);
        window.URL.revokeObjectURL(stream);
    }

    render() {
        return <div className="webcamViewport" style={{ width: this.props.width, height: this.props.height, overflow: "hidden" }}>
            <div id="stream"><video width={this.props.width} height={this.props.height} /></div>
        </div>
    }

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

        return <div className="coordinator" style={{ width: this.props.width, height: this.props.height, position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
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
        this.handleChange.bind(this)
        this.handleStop.bind(this)
    }

    handleChange(position, key) {
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
                <Webcam width={this.props.width} height={this.props.height} perspective={{ before, after }} device={this.props.device} />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handleChange(position, "before") } }
                    onStop={(position) => { this.handleStop() } }
                    position={this.state.before}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    symbol={
                        (props) => { return <svg height="100%" width="100%"><rect x="0" y="0" width="10" height="10" fill={props.fill} stroke="white" strokeWidth="1" /></svg> }
                    }
                    />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handleChange(position, "after") } }
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

Webcam = connect()(Webcam);
Coordinator = connect()(Coordinator);
PerspectiveWebcam = connect(null, (dispatch => { return { dispatch } }))(PerspectiveWebcam);
VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);