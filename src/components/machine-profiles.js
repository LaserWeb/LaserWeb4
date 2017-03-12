import React from 'react';
import { dispatch, connect } from 'react-redux';
import {FormGroup, FormControl, ControlLabel, Button, InputGroup, Glyphicon, ButtonGroup, ButtonToolbar} from 'react-bootstrap'

import { addMachineProfile, delMachineProfileId } from '../actions/settings';

import stringify from 'json-stringify-pretty-compact';
import slug from 'slug'

import Icon from './font-awesome';

import { alert, prompt, confirm} from './laserweb';

class MachineProfile extends React.Component {
    
    constructor(props)
    {
        super(props);
        this.handleApply.bind(this);
        this.handleSelect.bind(this);
        this.handleInput.bind(this);
        this.handleSave.bind(this);
        
        let selected = this.props.settings.__selectedProfile || "";
        
        this.state={selected: selected , newLabel: '', newSlug:''}
    }
    
    handleApply(e) {
       let selected=this._getSelectedProfile()
       let profileId = this.state.selected
       if (selected) {
            confirm("Are you sure? Current settings will be overwritten.",(b)=>{
                if (b) this.props.onApply({...selected.settings , __selectedProfile: profileId });
            })
       }
       return ;
    }
    
    handleSelect(e){
        let value=e.target.value
        this.setState({selected: value});
        
    }
    
    handleDelete(e){
        this.props.dispatch(delMachineProfileId(this.state.selected));
        this.setState({selected: '', newLabel:'', newSlug:''})
    }
    
    handleSave(e) {
        let currentProfile = this._getSelectedProfile();
        this.props.dispatch(addMachineProfile(this.state.selected, {...currentProfile, settings: this.props.settings}))
    }
    
    handleAppend(e){
        this.props.dispatch(addMachineProfile(this.state.newSlug, {machineLabel: this.state.newLabel, settings: this.props.settings}))
        this.setState({selected: this.state.newSlug})
        
    }
    
    handleInput(e){
        this.setState({newLabel: e.target.value, newSlug: slug(e.target.value)})
    }
    
    _getSelectedProfile()
    {
        if(typeof this.props.profiles[this.state.selected]!=="undefined")
            return this.props.profiles[this.state.selected];
        
        return undefined;
    }

    render(){
        
        let profileOptions=[];
        let description;
        let selected;
        let disabledDelete=!this.state.selected.length || this.state.selected.substr(0,1)=='*';
        
        
        Object.keys(this.props.profiles).forEach((key) => {
            let profile=this.props.profiles[key];
            
            profileOptions.push(<option key={key} value={key} >{profile.machineLabel}</option>);
        });
        
        
        if (selected=this._getSelectedProfile()){
            let settings=stringify(this.props.profiles[this.state.selected].settings);
            let machinedesc=this.props.profiles[this.state.selected].machineDescription;
            description=(<details><summary>{machinedesc? machinedesc : "Details" }</summary><pre>{settings}</pre></details>);
        }
        
        
        
        return (
            
                <div>
                <FormGroup controlId="formControlsSelect">
                    <h5>Apply predefined machine profile</h5>
                    {this.state.selected ? (<small>Machine Id: <code>{this.state.selected}</code></small>):undefined}
                    <FormControl componentClass="select" onChange={(e)=>{this.handleSelect(e)}} value={this.state.selected} ref="select" className="full-width">
                      <option value="">Select a Machine Profile</option>
                      {profileOptions}
                      
                    </FormControl>
                    
                    
                    
                    <ButtonGroup>
                        <Button bsClass="btn btn-xs btn-info" onClick={(e)=>{this.handleApply(e)}}><Icon name="share" /> Apply</Button>
                        <Button bsClass="btn btn-xs btn-warning" onClick={(e)=>{this.handleSave(e)}}><Icon name="save" /> Save</Button>
                        <Button bsClass="btn btn-xs btn-danger" onClick={(e)=>{this.handleDelete(e)}} disabled={disabledDelete}><Glyphicon glyph="trash" /> Delete</Button>
                    </ButtonGroup>
                     <small className="help-block">Use this dialog to apply predefined machine settings. This settings will override current settings. Use with caution.</small>
                    {description}
                    </FormGroup>
                    
                    
                    <FormGroup controlId="formControlsAppend">
                   
                    <h5>New profile</h5>
                    {this.state.newSlug ? (<small>Machine Id: <code>{this.state.newSlug}</code></small>):undefined}
                     <InputGroup>
                        
                        <FormControl type="text" onChange={(e)=>{this.handleInput(e)}} ref="newLabel" value={this.state.newLabel}/>
                        <InputGroup.Button>
                        <Button bsClass="btn btn-success" onClick={(e)=>{this.handleAppend(e)}}><Glyphicon glyph="plus-sign" /></Button>
                        </InputGroup.Button>
                     </InputGroup>
                     
                    <small className="help-block">Use this dialog to add the current settings to a new profile.</small>
                </FormGroup>
                </div>
            
            
           
            
        )
        
        
    }
    
    
}
 
 
const mapStateToProps = (state) => {
  return {
    profiles: state.machineProfiles,
    settings: state.settings
  }
};
 
export {MachineProfile}
export default connect(mapStateToProps)(MachineProfile);