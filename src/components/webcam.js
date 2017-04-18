import 'webrtc-adapter';

import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Rnd from 'react-rnd';
import Draggable from 'react-draggable';
import Icon from './font-awesome'
import Select from 'react-select'
import Toggle from 'react-toggle'
import { FormGroup, InputGroup, ControlLabel, Button } from 'react-bootstrap'

import '../styles/webcam.css';

import { DEFAULT_VIDEO_RESOLUTION, VIDEO_RESOLUTIONS, videoResolutionPromise, getSizeByVideoResolution, getVideoResolution } from '../lib/video-capture'



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
                let { resolutions, resolutionId } = props;
                console.log("refreshing resolutions...")
                this.setState({ resolutions, isLoading: false, selected: resolutionId })
                this.handleChange({ value: resolutionId })
            })
        } else {
            this.setState({ resolutions: [] })
            this.handleChange({ value: null })
        }
    }

    setResolution(resolutionId) {
        window.videoCapture.refreshStream({ resolution: resolutionId }, (s) => { console.log('Resolution change: ' + resolutionId + ' [' + s.id + ']') })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.deviceId !== this.props.deviceId) {
            this.getResolutions(nextProps.deviceId)
        }
    }

    handleChange(v) {
        this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }));
        if (v.value) this.setResolution(v.value)
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


export class VideoPort extends React.Component {

    componentDidMount() {
        this.enableVideo()
    }
    componentDidUpdate(prevProps) {
        this.enableVideo();
    }

    enableVideo() {
        const selfNode = ReactDOM.findDOMNode(this);
        selfNode.style.pointerEvents = (this.props.enabled) ? 'all' : 'none';

        let enable = () => {
            if (!(window.videoCapture && window.videoCapture.isReady) && this.props.enabled)
                requestAnimationFrame(enable);

            const myvideo = selfNode.querySelector('video')

            if (this.props.enabled && myvideo) {
                const stream = window.videoCapture.getStream();
                if (myvideo.srcObject !== stream)
                    myvideo.srcObject = stream
                selfNode.style.display = 'block'
            } else {
                selfNode.style.display = 'none'
            }

        }
        try {
            enable();
        } catch (e) {

        }
    }
    
    render() {

        let video = <video ref="videoport" style={{ width: '100%' }} autoPlay />;

        if (this.props.draggable) {
            return <Rnd
                ref={c => { this.rnd = c; }}
                initial={{
                    width: this.props.width || 320,
                    height: this.props.height || 240,
                }}
                minWidth={160}
                minHeight={120}
                maxWidth={800}
                maxHeight={600}
                lockAspectRatio={true}
                bounds={this.props.draggable}
                zIndex={10000}
            >{video}</Rnd>
        } else {
            return <div>{video}</div>;
        }
    }
}

VideoPort.defaultProps = {
    draggable: false
}



VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoResolutionField = connect(null, (dispatch => { return { dispatch } }))(VideoResolutionField);
VideoPort = connect(state=>({settings: state.settings}))(VideoPort)