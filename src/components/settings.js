import React from 'react';
import { dispatch, connect } from 'react-redux';

import { NumberField, TextField, ToggleField, QuadrantField, FileField } from './forms';
import { setSettingsAttrs, uploadSettings, downloadSettings } from '../actions/settings';
import { uploadMachineProfiles, downloadMachineProfiles } from '../actions/machineProfiles';

import MachineProfile from './MachineProfile';

import {PanelGroup, Panel} from 'react-bootstrap';

import Validator from 'validatorjs';

import { Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup } from 'react-bootstrap';

import update from 'immutability-helper';

import stringify from 'json-stringify-pretty-compact';


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
                    <button onClick={() => this.props.handleDownload("settings",this.props.settings)} type="button" className="btn btn-success btn-sm" aria-label="Download Settings">Backup Settings <span className="fa fa-download fa-fw" aria-hidden="true"></span></button>&nbsp;
                    <FileField label="Upload Settings" dispatch={(e) => this.props.handleUpload(e,uploadSettings)}   buttonClass="btn btn-danger btn-sm"/>
                    <h5>Profiles</h5>
                    
                        <button onClick={() => this.props.handleDownload("profiles", this.props.profiles)} type="button" className="btn btn-success btn-sm"  aria-label="Download Profiles">Backup Profiles <span className="fa fa-download fa-fw" aria-hidden="true"></span></button>&nbsp;
                    <FileField label="Upload Machine Profiles" dispatch={(e) => this.props.handleUpload(e,uploadMachineProfiles)}   buttonClass="btn btn-danger btn-sm "/>
                </Panel>
            </PanelGroup>
                
            
            
          </div>
        );
    
        
    }
}

const mapStateToProps = (state) => {
  return { settings: state.settings, profiles: state.machineProfiles }
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleDownload: (name, settings) => {
        
        let json = stringify(settings);
        let blob = new Blob([json], {type: "application/json"});

        let tempLink = document.createElement('a');
            tempLink.href = window.URL.createObjectURL(blob);
            tempLink.setAttribute('download', 'laserweb-'+name+'.json');
            tempLink.click();
        
        dispatch(downloadSettings(settings));
    },
    handleUpload: (e,action) => {
       let file = e.target.files[0];
       let reader = new FileReader;
            reader.onload = () => dispatch(action(file, reader.result));
            reader.readAsText(file);
    },
    
    handleApplyProfile: (settings) => {
        dispatch(setSettingsAttrs(settings));
    }
    
    
    
  };
};

export {Settings}
export default connect(mapStateToProps, mapDispatchToProps)(Settings);