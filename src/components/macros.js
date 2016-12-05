import React from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';

import {addMacro, removeMacro, setMacro} from '../actions/macros'

export class Macros extends React.Component {
    
    constructor(props){
        super(props)
        
        this.state = {selected:[], label:"", keybinding:"", gcode:""}
        
        this.handleSelection.bind(this)
        this.handleAppend.bind(this)
        this.handleRemove.bind(this)
        this.handleFormChange.bind(this)
    }
    
    handleSelection(e){
        let opts=[].slice.call(e.target.selectedOptions).map(o => {return o.value;});
        
            this.setState({keybinding: e.target.value,
                          label: this.props.macros[e.target.value].label,
                          gcode: this.props.macros[e.target.value].gcode,
                          selected: opts
                          })
        
    }
    
    handleAppend(e){
        let macro;
        if (macro=this.getForm())
            this.props.handleSet(macro)
    }
    
    handleRemove(e)
    {
        this.props.handleRemove(this.state.selected)
        this.setState({selected:[]})
    }
    
    handleFormChange(e,fieldid){
        this.setState({[fieldid]: e.target.value});
    }
    
    getForm(){
        let label=ReactDOM.findDOMNode(this.refs.label).value
        let keybinding=ReactDOM.findDOMNode(this.refs.keybinding).value
        let gcode=ReactDOM.findDOMNode(this.refs.gcode).value
        if (label && keybinding && gcode)
            return { [keybinding]: {label, gcode}}
        return null;    
    }
    
    render(){
        return (
            <div className="macros">
                <small className="help-block">Append new key binding to Gcode</small>
                <select size="10" multiple onChange={(e)=>this.handleSelection(e)} value={this.state.selected}>
                    {Object.entries(this.props.macros).map((opt,i)=>{ let [key,value] = opt; return <option key={i} value={key}>[{key}] {value.label}</option>})}
                </select>
                <input type="text" ref="label" placeholder="Label" value={this.state.label} onChange={(e)=>this.handleFormChange(e,'label')}/>
                <input type="text" ref="keybinding" placeholder="Keybinding" value={this.state.keybinding} onChange={(e)=>this.handleFormChange(e,'keybinding')}/>
                <textarea ref="gcode" placeholder="Gcode" value={this.state.gcode} onChange={(e)=>this.handleFormChange(e,'gcode')}/>
                <button onClick={(e)=>this.handleAppend(e)}>Set</button>
                <button onClick={(e)=>this.handleRemove(e)}>Remove Selected</button>
            </div>
            
        )
    }
}

const mapStateToProps = (state) => {
  return {
    macros: state.macros
  }
};

const mapDispatchToProps = (dispatch) => {
    return {
        handleRemove: (keybinding)=>{dispatch(removeMacro(keybinding))},
        handleSet: (macro)=>{ dispatch(setMacro(macro))},
    }
}
 

Macros = connect(mapStateToProps,mapDispatchToProps)(Macros);