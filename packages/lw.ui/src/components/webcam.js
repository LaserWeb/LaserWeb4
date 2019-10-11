import 'webrtc-adapter';

import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Rnd from 'react-rnd';
import Icon from './font-awesome'
import Select from 'react-select'
import Toggle from 'react-toggle'
import { FormGroup, InputGroup, ControlLabel, Button, FormControl } from 'react-bootstrap'

import '../styles/webcam.css';

import { DEFAULT_VIDEO_RESOLUTION, VIDEO_RESOLUTIONS, videoResolutionPromise, getSizeByVideoResolution, getVideoResolution } from '../lib/video-capture'

import { openDataWindow } from '../lib/helpers';

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
            <Select disabled={this.props.disabled} options={this.state.devices} value={this.props.object[this.props.field]} onChange={(v) => this.handleSelection(v)} clearable={false} />
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
        this.__mounted=true;
        this.enableVideo()
    }
    componentDidUpdate(prevProps) {
        this.enableVideo();
    }

    componentWillUnmount()
    {
        this.__mounted=false;
    }

    shouldComponentUpdate(nextProps)
    {
        return nextProps.settings.toolVideoDevice !== this.props.settings.toolVideoDevice ||
               nextProps.settings.toolVideoResolution !== this.props.settings.toolVideoResolution ||
               nextProps.enabled !== this.props.enabled ||
               nextProps.settings.toolWebcamUrl !== this.props.settings.toolWebcamUrl
               
    }

    enableVideo() {
        const selfNode = ReactDOM.findDOMNode(this);
        selfNode.style.pointerEvents = (this.props.enabled) ? 'all' : 'none';
        
        let enable = () => {
            if (this.props.settings.toolWebcamUrl) {
                if (this.props.enabled){
                    const imageFetch=()=>{
                        clearTimeout(this.__timeout)
                        if (this.__mounted && this.props.settings.toolWebcamUrl){
                            const img=ReactDOM.findDOMNode(this.refs['display'])
                                 
                            let src=this.props.settings.toolWebcamUrl;
                                src+=(src.indexOf('?')>=0)? '&':'?';
                                src+='time='+(new Date().getTime()/1000)
                                img.src= src;
                                selfNode.style.display = 'block'
                            this.__timeout=setTimeout(imageFetch,5000)
                        }
                    } 
                    imageFetch();
                } else {
                    selfNode.style.display = 'none'
                }
            } else {

                if (!(window.videoCapture && window.videoCapture.isReady) && this.props.enabled)
                    requestAnimationFrame(enable);

                if (this.props.enabled) {
                    const stream = window.videoCapture.getStream();
                    const { width, height } = getVideoResolution(this.props.settings.toolVideoResolution)
                    if (this.props.useCanvas){
                        const display=ReactDOM.findDOMNode(this.refs['display'])
                        const myvideo=document.createElement('video')
                            myvideo.autoplay=true;
                            myvideo.width=width
                            myvideo.height=height;
                            display.width=width;
                            display.height=height;

                        if (myvideo.srcObject !== stream)
                            myvideo.srcObject = stream

                        const draw=function(){
                            if (this.__mounted && display && this.props.enabled) {
                                let context = display.getContext('2d');
                                    context.drawImage(myvideo, 0, 0);

                                if (this.props.canvasProcess)
                                    this.props.canvasProcess(display, this.props.settings);
                                
                                requestAnimationFrame(draw)
                            }
                        }.bind(this);
                        if (this.__mounted)
                            draw();
                    } else {
                        const myvideo=ReactDOM.findDOMNode(this.refs['display'])
                            myvideo.srcObject=stream;
                            myvideo.autoPlay=true;
                            myvideo.width=width
                            myvideo.height=height;
                    }

                    selfNode.style.display = 'block'
                } else {
                    selfNode.style.display = 'none'
                }
            }

        }
        try {
            enable();
        } catch (e) {
            throw e;
        }
    }
    
    render() {
        let element;
        if (this.props.useCanvas) {
            element=<canvas ref="display" style={{width:"100%", height:"auto"}}/>
        } else if (!this.props.settings.toolWebcamUrl.length) {
            element = <video ref="display" style={{width:"100%",height:"auto"}} autoPlay/>
        } else {
            element = <img ref="display" style={{width:"100%",height:"auto"}} draggable="false"/>
        }
       
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
                zIndex={800}
            >{element}</Rnd>
        } else {
            return <div>{element}</div>;
        }
    }
}

VideoPort.defaultProps = {
    draggable: false
}



VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoResolutionField = connect(null, (dispatch => { return { dispatch } }))(VideoResolutionField);
VideoPort = connect(state=>({settings: state.settings}))(VideoPort)

export const ArMarker=require('aruco-marker');

const randomIntFromInterval=(min,max)=>{
    return Math.floor(Math.random()*(max-min+1)+min);
}

export class ArucoMarker extends React.Component {

    constructor(props){
        super(props)
        this.state={number: randomIntFromInterval(0,1024)}
    }
    render(){

        const rand=()=>{this.setState({number: randomIntFromInterval(0,1024)})}
        const setNumber=(e)=>{this.setState({number: e.target.value})}
        const popupMarker=(e)=>{
            let myMarker = new ArMarker(this.state.number);
            let svg=myMarker.toSVG('500px');
            openDataWindow(svg,'image/svg+xml','arucomarker')
        }

        return <FormGroup>
        <InputGroup>
            <InputGroup.Button>
            <Button bsStyle="info" onClick={rand}><Icon name="random"/></Button>
            </InputGroup.Button>
            <FormControl type="number" placeholder="0 to 1024" min="0" max="1024" value={this.state.number} onChange={setNumber} />
            <InputGroup.Button>
            <Button bsStyle="primary" onClick={popupMarker}>Generate Marker</Button>
            </InputGroup.Button>
        </InputGroup>
        </FormGroup>
    }
}