import React from 'react';
import ReactDOM from 'react-dom'
import { dispatch, connect } from 'react-redux';

import { NumberField, TextField, ToggleField, QuadrantField, FileField, CheckBoxListField } from './forms';
import { setSettingsAttrs, uploadSettings, downloadSettings, uploadMachineProfiles, downloadMachineProfiles, uploadSnapshot, downloadSnapshot, storeSnapshot, recoverSnapshot  } from '../actions/settings';

import MachineProfile from './machine-profile';

import {PanelGroup, Panel} from 'react-bootstrap';

import Validator from 'validatorjs';

import { Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label } from 'react-bootstrap';

import update from 'immutability-helper';

import stringify from 'json-stringify-pretty-compact';

import {FileStorage, LocalStorage} from '../lib/storages';


import omit from 'object.omit';

export class ApplicationSnapshot extends React.Component {
    
    constructor(props) {
        super(props);
        this.state={keys:[]}
        
        this.handleChange.bind(this)
        
        this.handleDownload.bind(this)
        this.handleStore.bind(this)
        this.handleRecover.bind(this)
    }
    
    handleChange(data)
    {
        this.setState({keys:data})
    }
    
    handleDownload(e)
    {
        let keys=this.state.keys;
        let state = this.props.state;
        let exp={}
            keys.forEach((o)=>{exp[o]=state[o]})
        
        this.props.onDownload(e,exp)
    }
    
    handleStore(e)
    {
        this.props.onStore(e,omit(this.props.state,['documents','operations','gcode']))
    }
    
    handleRecover(e)
    {
        this.props.onRecover(e)
    }
    
    render(){
        
        let data = Object.keys(this.props.state);
        
        return (
        <div>
            <CheckBoxListField onChange={(data)=>this.handleChange(data)} data={data}/>
            <button onClick={() => this.handleDownload()} type="button" className="btn btn-success btn-sm" aria-label="Download Snapshot">Download Snapshot <span className="fa fa-camera fa-fw" aria-hidden="true"></span></button>&nbsp;
            <FileField label="Upload Snapshot" dispatch={(e) => this.props.handleUpload(e,uploadSnapshot)}   buttonClass="btn btn-danger btn-sm " icon="fa-camera"/>&nbsp;
                 
            <button onClick={(e) => this.handleStore(e)} type="button" className="btn btn-success btn-sm" aria-label="Store Snapshot">Store Snapshot <span className="fa fa-camera fa-fw" aria-hidden="true"></span></button>&nbsp;
            <button onClick={(e) => this.handleRecover(e)} type="button" className="btn btn-danger btn-sm" aria-label="Recover Snapshot">Recover Snapshot <span className="fa fa-camera fa-fw" aria-hidden="true"></span></button>
            
        </div>
        )
    }
    
}


class Settings extends React.Component {
    
    constructor(props){
        super(props);
        this.state = { errors: null }
        
    }
    
    /* TODO: Move to a rules file so can be reused with other components/actions/reducers */
    rules() {
        return {
            machineWidth:'min:100',
            machineHeight:'min:100',
            gcodeLaserOn:'required',
            gcodeLaserOff:'required'
        }
    }
    
    validate(props, rules={}) {
        let check = new Validator(props, rules );
        
        if (check.fails()) {
            console.error("Settings Error:"+JSON.stringify(check.errors.errors));
            return check.errors.errors;
        }
        return null;
    }
   
    componentWillMount() {
        this.setState({errors:this.validate(this.props.settings,this.rules())})
    }
   
    componentWillReceiveProps(nextProps) {
        this.setState({errors:this.validate(nextProps.settings,this.rules())})
    }
    
    
   
    render() {
        
        return (
            <div className="form">
            
            
            
            <PanelGroup>
                <Panel header="Machine Profiles"  bsStyle="primary" collapsible defaultExpanded={true} eventKey="0">
                <MachineProfile onApply={this.props.handleApplyProfile}/>
                </Panel>
                <Panel collapsible header="Machine" eventKey="1" bsStyle="info">
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Machine Height', units: 'mm' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineBeamDiameter', setAttrs: setSettingsAttrs, description: 'Laser Beam Diameter', units: 'mm' }} />
                </Panel>
                
                <Panel collapsible header="File Settings" eventKey="2"  bsStyle="info">
                   <h4>SVG</h4>
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiDefault', setAttrs: setSettingsAttrs, description: 'Default DPI', units: 'dpi' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiIllustrator', setAttrs: setSettingsAttrs, description: 'Illustrator DPI', units: 'dpi' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiInkscape', setAttrs: setSettingsAttrs, description: 'Inkscape DPI', units: 'dpi' }} />
                   <h4>BMP</h4>
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiBitmap', setAttrs: setSettingsAttrs, description: 'Bitmap DPI', units: 'dpi' }} />
                </Panel>
                <Panel collapsible header="Gcode" eventKey="3"  bsStyle="info">
                  <h4>Gcode generation</h4>
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeStart', setAttrs: setSettingsAttrs, description: 'Gcode Start', rows:5}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeEnd', setAttrs: setSettingsAttrs, description: 'Gcode End', rows:5}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeHoming', setAttrs: setSettingsAttrs, description: 'Gcode Homing', rows:5}} />
                  
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeLaserOn', setAttrs: setSettingsAttrs, description: 'Laser ON'}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeLaserOff', setAttrs: setSettingsAttrs, description: 'Laser OFF'}} />
                </Panel>
                <Panel collapsible header="Application" eventKey="4"  bsStyle="info">
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolCncMode', setAttrs: setSettingsAttrs, description: 'Enable CNC Mode'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolUseNumpad', setAttrs: setSettingsAttrs, description: 'Use Numpad'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolUseVideo', setAttrs: setSettingsAttrs, description: 'Use Video Overlay'}} />
                    <TextField   {... {errors: this.state.errors, object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url'}} />
                    <hr/>
                    <QuadrantField {... {errors: this.state.errors, object: this.props.settings, field: 'toolImagePosition', setAttrs: setSettingsAttrs, description: 'Raster Image Position', available:["TL","BL"]}} />
                </Panel>
                <Panel collapsible header="Tools" bsStyle="danger" eventKey="5">
                    <h5>Settings</h5>
                    <button onClick={() => this.props.handleDownload('laserweb-settings.json',this.props.settings)} type="button" className="btn btn-success btn-sm" aria-label="Download Settings">Backup Settings <span className="fa fa-download fa-fw" aria-hidden="true"></span></button>&nbsp;
                    <FileField label="Upload Settings" dispatch={(e) => this.props.handleUpload(e.target.files[0],uploadSettings)}   buttonClass="btn btn-danger btn-sm"/>
                    <h5>Profiles</h5>
                    
                        <button onClick={() => this.props.handleDownload('laserweb-profiles.json', this.props.profiles)} type="button" className="btn btn-success btn-sm"  aria-label="Download Profiles">Backup Profiles <span className="fa fa-download fa-fw" aria-hidden="true"></span></button>&nbsp;
                    <FileField label="Upload Machine Profiles" dispatch={(e) => this.props.handleUpload(e.target.files[0],uploadMachineProfiles)}   buttonClass="btn btn-danger btn-sm "/>
                        
                    <h5>Application Snapshot  <Label bsStyle="warning">Experimental!</Label></h5>
                    
                    <ApplicationSnapshot
                        onDownload={(e,state)=>this.props.handleDownload("laserweb-snapshot.json",state, downloadSnapshot)}
                        onUpload={(e) => this.props.handleUpload(e.target.files[0],uploadSnapshot)}
                        onStore={(e,state) => this.props.handleStore("snapshot",state, storeSnapshot)}
                        onRecover={(e) => this.props.handleRecover("snapshot", uploadSnapshot)}
                    />
                    
                </Panel>
            </PanelGroup>
                
            
            
          </div>
        );
    
        
    }
}

const mapStateToProps = (state) => {
    
  return { settings: state.settings, profiles: state.machineProfiles}
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleDownload: (name, settings, action) => {
        FileStorage.save(name, stringify(settings),"application/json" )
        dispatch(action(settings));
    },
    handleUpload: (name,action) => {
       FileStorage.load(name, (file, result) => dispatch(action(file, result)));
    },
    
    handleStore: (name, settings, action) =>{
        LocalStorage.save(name, stringify(settings),"application/json")
        dispatch(action(settings));
    },
    
    handleRecover: (name,action) => {
       LocalStorage.load(name, (file, result) => dispatch(action(file, result)));
    },
    
    
    handleApplyProfile: (settings) => {
        dispatch(setSettingsAttrs(settings));
    },
    
   
    
  };
};

export {Settings}

ApplicationSnapshot = connect((state) => {
  return { state: state}
},mapDispatchToProps)(ApplicationSnapshot);;

export default connect(mapStateToProps, mapDispatchToProps)(Settings);