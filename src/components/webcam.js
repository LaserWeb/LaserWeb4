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
import { FileField } from './forms'
import { setWorkspaceAttrs } from '../actions/workspace';

const defaultProcess = ({canvas, video, settings}) =>{
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) 
        return ;

    let context = display.getContext('2d');
    if (context) context.drawImage(video, 0, 0);
    return ()=>{}
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
            isLoading: false,
            selected:this.props.object[this.props.field]
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
        this.setState({selected: resolutionId})
        window.videoCapture.refreshStream({ resolution: resolutionId }, (s) => { console.log('Resolution change: ' + resolutionId + ' [' + s.id + ']') })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.deviceId !== this.props.deviceId) {
            this.getResolutions(nextProps.deviceId)
        }
    }

    handleChange(v) {
        if (v.value && (v.value!==this.state.selected)) {
            this.setResolution(v.value)
            this.props.dispatch(this.props.setAttrs({ [this.props.field]: v.value }));
        }
    }

    render() {
        let resolutions = this.state.resolutions.map((v) => { return { label: `${v.label} (${v.width} x ${v.height}) / ${v.ratio}`, value: v.label } })
        
        return <FormGroup>
            <ControlLabel>{this.props.description}</ControlLabel>
            <Select isLoading={this.state.isLoading} options={resolutions} value={this.state.selected} clearable={false} disabled={!this.props.deviceId} onChange={(v) => this.handleChange(v)} />
        </FormGroup>
    }
}


VideoResolutionField.defaultProps = {
    description: 'Video Resolution'
}


export class VideoPort extends React.Component {

    constructor(props){
        super(props)
        this.snapshot=this.snapshot.bind(this)
    }

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
               nextProps.useCanvas !== this.props.useCanvas ||
               nextProps.canvasProcess !== this.props.canvasProcess
    }

    enableVideo() {
        const selfNode = ReactDOM.findDOMNode(this);
        selfNode.style.pointerEvents = (this.props.enabled) ? 'all' : 'none';
        
        let enable = () => {
            if (!(window.videoCapture && window.videoCapture.isReady) && this.props.enabled)
                return requestAnimationFrame(enable);

            if (this.props.enabled) {
                
                const stream = window.videoCapture.getStream();
                const { width, height } = getVideoResolution(this.props.settings.toolVideoResolution)
                if (this.props.useCanvas){
                    const display=ReactDOM.findDOMNode(this.refs['display'])
                    const myvideo=document.createElement('video')
                          myvideo.autoPlay=true;
                          myvideo.width=width
                          myvideo.height=height;
                          display.width=width;
                          display.height=height;

                    if (myvideo.srcObject !== stream)
                        myvideo.srcObject = stream
                    

                    
                    let canvasProcess=this.props.canvasProcess || defaultProcess
                    let killProcess;
                    const draw=function(){ 
                        if (this.__mounted && display && this.props.enabled && this.props.useCanvas ) {
                            if (myvideo.readyState === myvideo.HAVE_ENOUGH_DATA) 
                                killProcess = canvasProcess({ canvas: display, video: myvideo,settings: this.props.settings })
                            requestAnimationFrame(draw)
                        } else {
                            if (killProcess) killProcess();
                        }
                    }.bind(this);
                    if (this.__mounted){
                        draw();
                    }
                        
                } else {
                    const myvideo=ReactDOM.findDOMNode(this.refs['display'])
                          myvideo.srcObject=stream;
                          myvideo.autoplay=true;
                          myvideo.width=width
                          myvideo.height=height;
                }

                selfNode.style.display = 'block'
            } else {
                
                selfNode.style.display = 'none'
            }

        }
        try {
            
            enable();
        } catch (e) {
            throw e;
        }
    }
    
    snapshot(e){
        const display=ReactDOM.findDOMNode(this.refs['display'])
        let transfer=document.createElement("canvas");
            transfer.width=display.width; 
            transfer.height=display.height;
        let context=transfer.getContext('2d')
            context.drawImage(display,0,0);
            this.props.dispatch(setWorkspaceAttrs({tracer: Object.assign(this.props.workspace.tracer || {alpha:50},{ 
                name: "Webcam Snapshot", 
                dataURL: transfer.toDataURL(), 
                timestamp: (new Date()).getTime()
            } )}))
    }

    render() {

        const element= (this.props.useCanvas) ? <canvas ref="display" style={{width:"100%", height:"auto"}} onDoubleClick={this.snapshot}/> : <video ref="display" style={{width:"100%",height:"auto", background:"white"}} onDoubleClick={this.snapshot}/>
        const overlay=undefined;

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
            >{overlay}{element}</Rnd>
        } else {
            return <div>{overlay}{element}</div>;
        }
    }
}

VideoPort.defaultProps = {
    draggable: false
}



VideoDeviceField = connect(null, (dispatch => { return { dispatch } }))(VideoDeviceField);
VideoResolutionField = connect(null, (dispatch => { return { dispatch } }))(VideoResolutionField);
VideoPort = connect(state=>({settings: state.settings, workspace: state.workspace}))(VideoPort)

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

export class TracerImageButton extends React.Component {
    constructor(props){
        super(props)
        this.loadTracer=this.loadTracer.bind(this)
        this.removeTracer=this.removeTracer.bind(this)
        this.alphaTracer=this.alphaTracer.bind(this)
    }

    loadTracer(e){
        if (!e.target.files.length) return;
        let file = e.target.files[0];
        let reader = new FileReader;
            reader.onload=()=>{
                this.props.dispatch(setWorkspaceAttrs({tracer: Object.assign(this.props.workspace.tracer || { alpha:50 },{
                    dataURL: reader.result, 
                    name: file.name, 
                    timestamp: (new Date()).getTime()
                })}));
            }
            reader.readAsDataURL(file);
    }

    removeTracer(){
         this.props.dispatch(setWorkspaceAttrs({tracer: null}));
    }

    alphaTracer(e){
        if (this.props.workspace.tracer)
            this.props.dispatch(setWorkspaceAttrs({tracer: Object.assign(this.props.workspace.tracer, {alpha: e.target.value})}));
    }

    render(){
        let filename = (this.props.workspace.tracer && this.props.workspace.tracer.name) ? this.props.workspace.tracer.name : undefined
        let alpha = (this.props.workspace.tracer) ?  this.props.workspace.tracer.alpha : 50
        return <div> <h5 className="truncate" title={filename}>Tracing Image <strong>{filename}</strong> </h5>
            <div className='input-group'>
                <FileField style={{ cursor: 'pointer' }} className="input-group-btn" onChange={this.loadTracer} accept=".png,.jpg,.jpeg,.bmp">
                <button title="Pick a tracing image" className="btn btn-primary "><i className="fa fa-fw fa-upload" /></button>
                </FileField>
                <input  class='form-control' disabled={!filename? true:undefined}  type="range" value={alpha} step="10" min="10" max="100" is glyphicon="eye-close" onChange={this.alphaTracer} />
                <span className='input-group-btn'><button title="Remove tracing image" className="btn btn-danger " disabled={!filename} onClick={this.removeTracer}><i className="fa fa-fw fa-trash" /></button></span>
            </div>
       </div>
    }
}

TracerImageButton = connect(
    (state)=>({
        workspace:state.workspace
    })
)(TracerImageButton);