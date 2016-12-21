import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import { NumberField, TextField, ToggleField, QuadrantField, FileField, CheckBoxListField, SelectField } from './forms';
import { setSettingsAttrs, uploadSettings, downloadSettings, uploadMachineProfiles, downloadMachineProfiles, uploadSnapshot, downloadSnapshot, storeSnapshot, recoverSnapshot  } from '../actions/settings';

import MachineProfile from './machine-profiles';
import { MaterialDatabaseButton } from './material-database';
import { Macros } from './macros' 



import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge } from 'react-bootstrap';

import update from 'immutability-helper';

import stringify from 'json-stringify-pretty-compact';

import {FileStorage, LocalStorage} from '../lib/storages';

import Icon from './font-awesome';

import omit from 'object.omit';

import Validator from 'validatorjs';


import {SETTINGS_VALIDATION_RULES, ValidateSettings} from '../reducers/settings';

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

class SettingsPanel extends React.Component {
    
    render() {
        let filterProps=omit(this.props,['header','errors','defaultExpanded']);
        let childrenFields=this.props.children.map((item)=>{ return item.props.field})
        let hasErrors=Object.keys(this.props.errors || []).filter((error)=> {return childrenFields.includes(error)}).length;
        
        filterProps['defaultExpanded']=(this.props.defaultExpanded || hasErrors)?true:false
        
        let children=this.props.children.map((child,i)=>{
            let props={key:i}
            if (child.props.field) props['errors']=this.props.errors;
            return React.cloneElement(child, props);
        })
        
        let icon=hasErrors? <Label bsStyle="warning">Please check!</Label>:undefined;
        
        return <Panel {...filterProps} header={<span>{icon}{this.props.header}</span>} >{children}</Panel>
    }
    
}






export function SettingsValidator({style, className='badge', noneOnSuccess=false,...rest}){
    let validator=ValidateSettings(false);
    let errors =  (validator.fails()) ? ("Please review Settings:\n\n" + Object.values(validator.errors.errors)) : undefined
    if (noneOnSuccess && !errors) return null;
    return <span className={className} title={errors? errors: "Good to go!"} style={style}><Icon name={errors? 'warning':'check'}/></span>
}

class Settings extends React.Component {
    
    constructor(props){
        super(props);
        this.state = { errors: null }
        
    }
    
    validate(data, rules) {
        let check = new Validator(data, rules );
        
        if (check.fails()) {
            console.error("Settings Error:"+JSON.stringify(check.errors.errors));
            return check.errors.errors;
        }
        return null;
    }
   
    rules()
    {
        return SETTINGS_VALIDATION_RULES;
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
                    
                    <MaterialDatabaseButton>Launch Material Database</MaterialDatabaseButton>
                </Panel>
                <SettingsPanel collapsible header="Machine" eventKey="1" bsStyle="info" errors={this.state.errors} >
                   <NumberField {...{ object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                   <NumberField {...{ object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Machine Height', units: 'mm' }} />
                   <NumberField {...{ object: this.props.settings, field: 'machineBeamDiameter', setAttrs: setSettingsAttrs, description: (<span>Beam <abbr title="Diameter">&Oslash;</abbr></span>), units: 'mm' }} />
                   
                   <hr/>
                   <ToggleField {... {object: this.props.settings, field: 'machineZEnabled', setAttrs: setSettingsAttrs, description: 'Machine Z stage'}} />
                   <Collapse in={this.props.settings.machineZEnabled}>
                   <div>
                   <ToggleField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZBlowerEnabled', setAttrs: setSettingsAttrs, description: 'Air Assist'}} />
                   <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZToolOffset', setAttrs: setSettingsAttrs, description: 'Tool offset', labelAddon:false,units: 'mm' }} />
                   </div>
                   </Collapse>
                   
                </SettingsPanel>
                
                <SettingsPanel collapsible header="File Settings" eventKey="2"  bsStyle="info" errors={this.state.errors}>
                   <h4>SVG</h4>
                   <NumberField {...{ object: this.props.settings, field: 'pxPerInch', setAttrs: setSettingsAttrs, description: 'PX Per Inch', units: 'pxpi' }} />
                   <h4>BMP</h4>       
                   <NumberField {...{ object: this.props.settings, field: 'dpiBitmap', setAttrs: setSettingsAttrs, description: 'Bitmap DPI', units: 'dpi' }} />
                </SettingsPanel>
                <SettingsPanel collapsible header="Gcode" eventKey="3"  bsStyle="info" errors={this.state.errors}>
                  <h4>Gcode generation</h4>
                  <TextField {...{ object: this.props.settings, field: 'gcodeStart', setAttrs: setSettingsAttrs, description: 'Gcode Start', rows:5, style:{resize: "vertical"}}} />
                  <TextField {...{ object: this.props.settings, field: 'gcodeEnd', setAttrs: setSettingsAttrs, description: 'Gcode End', rows:5, style:{resize: "vertical"}}} />
                  <TextField {...{ object: this.props.settings, field: 'gcodeHoming', setAttrs: setSettingsAttrs, description: 'Gcode Homing', rows:5, style:{resize: "vertical"}}} />
                  <TextField {...{ object: this.props.settings, field: 'gcodeToolOn', setAttrs: setSettingsAttrs, description: 'Tool ON', rows:5, style:{resize: "vertical"}}} />
                  <TextField {...{ object: this.props.settings, field: 'gcodeToolOff', setAttrs: setSettingsAttrs, description: 'Tool OFF', rows:5, style:{resize: "vertical"}}} />
                  <NumberField {...{ object: this.props.settings, field: 'gcodeSMaxValue', setAttrs: setSettingsAttrs, description: 'PWM Max S value' }} />
                </SettingsPanel>
                <SettingsPanel collapsible header="Application" eventKey="4"  bsStyle="info" errors={this.state.errors}>
                    <SelectField {...{ object: this.props.settings, field: 'toolFeedUnits', setAttrs: setSettingsAttrs, data:['mm/s','mm/min'], defaultValue:'mm/min', description: 'Feed Units', selectProps: {clearable:false}}} />
                    <ToggleField {... {object: this.props.settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock'}} />
                    <ToggleField {... {object: this.props.settings, field: 'toolCncMode', setAttrs: setSettingsAttrs, description: 'Enable CNC Mode'}} />
                    <ToggleField {... {object: this.props.settings, field: 'toolUseNumpad', setAttrs: setSettingsAttrs, description: 'Use Numpad'}} />
                    <ToggleField {... {object: this.props.settings, field: 'toolUseVideo', setAttrs: setSettingsAttrs, description: 'Use Video Overlay'}} />
                    <TextField   {... {object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url'}} />
                    <QuadrantField {... {object: this.props.settings, field: 'toolImagePosition', setAttrs: setSettingsAttrs, description: 'Raster Image Position', available:["TL","BL"]}} />
                </SettingsPanel>
                
                <Panel collapsible header="Macros" bsStyle="info" eventKey="5">
                    <Macros/>
                
                </Panel>
                
                <Panel collapsible header="Tools" bsStyle="danger" eventKey="6" >
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