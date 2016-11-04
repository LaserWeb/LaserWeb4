import React from 'react';
import { dispatch, connect } from 'react-redux';

import { NumberField, TextField, ToggleField, QuadrantField } from './forms';
import { setSettingsAttrs, uploadSettings, downloadSettings } from '../actions/settings';

import Collapse from 'rc-collapse';
import {Panel} from 'rc-collapse';
import 'rc-collapse/assets/index.css';

import Validator from 'validatorjs';


import update from 'immutability-helper';


class Settings extends React.Component {
    
    constructor(props){
        super(props);
        this.state = { errors: null }
        
    }
    
    rules() {
        return {
            machineWidth:'min:100',
            machineHeight:'min:100' 
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
            <div className="well well-sm">
            <button onClick={() => this.props.handleDownload(this.props.settings)} type="button" className="btn btn-default btn-success" aria-label="Download Settings">Backup Settings <span className="fa fa-download fa-fw" aria-hidden="true"></span></button>&nbsp;
                <div style={{position:"relative", display:"inline-block"}}>
                <button type="button" className="btn btn-default btn-danger" aria-label="Upload Settings">Restore Settings <span className="fa fa-upload fa-fw" aria-hidden="true"></span></button>
                <input onChange={(e) => this.props.handleUpload(e)} type="file" value="" style={{position:"absolute", left: 0, top:0, height:"100%", opacity:0, width:150}} />
                </div>
            
            </div>
           <Collapse accordion={false} onChange={this.handleChange} >
                <Panel header="Machine">
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Machine Height', units: 'mm' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineBeamDiameter', setAttrs: setSettingsAttrs, description: 'Laser Beam Diameter', units: 'mm' }} />
                </Panel>
                <Panel header="File Settings">
                   <h5>SVG</h5>
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiDefault', setAttrs: setSettingsAttrs, description: 'Default DPI', units: 'dpi' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiIllustrator', setAttrs: setSettingsAttrs, description: 'Illustrator DPI', units: 'dpi' }} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiInkscape', setAttrs: setSettingsAttrs, description: 'Inkscape DPI', units: 'dpi' }} />
                   <h5>BMP</h5>
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'dpiBitmap', setAttrs: setSettingsAttrs, description: 'Bitmap DPI', units: 'dpi' }} />
                </Panel>
                <Panel header="Gcode">
                  <h5>Gcode generation</h5>
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeStart', setAttrs: setSettingsAttrs, description: 'Gcode Start', rows:5}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeEnd', setAttrs: setSettingsAttrs, description: 'Gcode End', rows:5}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeHoming', setAttrs: setSettingsAttrs, description: 'Gcode Homing', rows:5}} />
                  
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeLaserOn', setAttrs: setSettingsAttrs, description: 'Laser ON'}} />
                  <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'gcodeLaserOff', setAttrs: setSettingsAttrs, description: 'Laser OFF'}} />
                </Panel>
                <Panel header="Tool">
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolCncMode', setAttrs: setSettingsAttrs, description: 'Enable CNC Mode'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolUseNumpad', setAttrs: setSettingsAttrs, description: 'Use Numpad'}} />
                    <ToggleField {... {errors: this.state.errors, object: this.props.settings, field: 'toolUseVideo', setAttrs: setSettingsAttrs, description: 'Use Video Overlay'}} />
                    <TextField   {... {errors: this.state.errors, object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url'}} />
                    <hr/>
                    <QuadrantField {... {errors: this.state.errors, object: this.props.settings, field: 'toolImagePosition', setAttrs: setSettingsAttrs, description: 'Raster Image Position', available:["TL","BL"]}} />
                </Panel>
          </Collapse>
          </div>
        );
    
        
    }
}

const mapStateToProps = (state) => {
  return { settings: state.settings }
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleDownload: (settings) => {
        /* Do I need to move this to a reducer or action?*/
        let json = JSON.stringify(settings);
        let blob = new Blob([json], {type: "application/json"});

        let tempLink = document.createElement('a');
            tempLink.href = window.URL.createObjectURL(blob);
            tempLink.setAttribute('download', 'laserweb-settings.json');
            tempLink.click();
        
        dispatch(downloadSettings(settings));
    },
    handleUpload: e => {
       let file = e.target.files[0];
       let reader = new FileReader;
            reader.onload = () => dispatch(uploadSettings(file, reader.result));
            reader.readAsText(file);
    },
    
    
    
  };
};

export {Settings}
export default connect(mapStateToProps, mapDispatchToProps)(Settings);