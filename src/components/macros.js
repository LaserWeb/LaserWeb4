import React from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import {PanelGroup, Panel, Tooltip} from 'react-bootstrap';

import Icon from './font-awesome'

import {addMacro, removeMacro, setMacro, fireMacroById} from '../actions/macros'
import {runCommand} from './com.js';

import {Button, FormControl, ButtonGroup, ButtonToolbar} from 'react-bootstrap'

import Validator from 'validatorjs';
import {MACRO_VALIDATION_RULES} from '../reducers/macros'

export class Macros extends React.Component {

    constructor(props){
        super(props)

        this.state = {selected:[], label:"", keybinding:"", gcode:"", meta:[]}

        this.handleSelection.bind(this)
        this.handleAppend.bind(this)
        this.handleRemove.bind(this)
        this.handleFormChange.bind(this)
        this.handleMeta.bind(this)

        this.metakeys=['ctrl','shift','command','alt']
    }

    handleSelection(e){
        let opts=[].slice.call(e.target.selectedOptions).map(o => {return o.value;});
            this.setState({selected: opts})
        if (e.target.value){
            this.setState({keybinding: e.target.value.toLowerCase(),
                          label: this.props.macros[e.target.value].label,
                          gcode: this.props.macros[e.target.value].gcode,
            })
        } else {
            this.setState({keybinding: "", label: "", gcode: "" })
        }

    }

    handleAppend(e){
        let macro=this.getForm();
        let errors=this.getErrors(macro);
        
        if (!errors) {
            this.props.handleSet({[macro.keybinding]: {label:macro.label, gcode:macro.gcode}})
        } else {
            console.error(JSON.stringify(errors))
        }
    
        this.setState({...macro, selected:[]})
    }

    handleRemove(e)
    {
        this.props.handleRemove(this.state.selected)
        this.setState({selected:[], keybinding: "", label: "", gcode: "" })
    }

    handleFormChange(e,fieldid){
        this.setState({[fieldid]: e.target.value});
    }
    
    handleMeta(e, item){

        let tokens=new Set(this.state.keybinding.trim().split("+"))

        if (tokens.has(item)) {
            tokens.delete(item);
        } else {
           tokens.add(item);
        }

        this.setState({keybinding: Array.from(tokens).sort().join('+')})
    }
    

    getForm(){
        let label=ReactDOM.findDOMNode(this.refs.label).value
        let keybinding=ReactDOM.findDOMNode(this.refs.keybinding).value
        let gcode=ReactDOM.findDOMNode(this.refs.gcode).value
        
        return { keybinding: [...this.state.meta, keybinding].join('+'), label, gcode}
    }
    
    getErrors(macro){
        let validator=new Validator(macro,MACRO_VALIDATION_RULES);
        return (validator.passes()) ? undefined: validator.errors.errors;
    }

    render(){
        
        let errors=this.getErrors(this.state);

        return (
            <div className="macros">
                <small className="help-block">Append new key binding to Gcode. Page must be reloaded to take effect</small>
                <FormControl componentClass="select" size="10" multiple onChange={(e)=>this.handleSelection(e)} value={this.state.selected}>
                    {Object.entries(this.props.macros).map((opt,i)=>{ let [key,value] = opt; return <option key={i} value={key}>[{key}] {value.label}</option>})}
                </FormControl>

                <FormControl type="text" ref="label" placeholder="Label" value={this.state.label} onChange={(e)=>this.handleFormChange(e,'label')}/>
                <FormControl type="text" ref="keybinding" placeholder="Keybinding" value={this.state.keybinding} onChange={(e)=>this.handleFormChange(e,'keybinding')}/>
                <ButtonGroup>
                {this.metakeys.map((meta,i)=>{return <Button key={i} bsSize="xsmall" bsStyle={(this.state.keybinding.indexOf(meta)!==-1)? 'primary':'default'} onClick={(e)=>this.handleMeta(e,meta)}>{meta}</Button>})}
                </ButtonGroup>
                <FormControl componentClass="textarea" ref="gcode" placeholder="Gcode" value={this.state.gcode} onChange={(e)=>this.handleFormChange(e,'gcode')}/>
                <Button bsStyle="primary" onClick={(e)=>this.handleAppend(e)} style={{float:"left"}} disabled={errors!==undefined} title={JSON.stringify(errors)}><Icon name="share"/> Set</Button>
                <Button bsStyle="danger" onClick={(e)=>this.handleRemove(e)} style={{float:"right"}}><Icon name="trash"/> Remove</Button>
            </div>

        )
    }
}

export class MacrosBar extends React.Component{
    
    handleRunMacro(keybinding, macros) {
        let {label, gcode} = macros[keybinding];
        console.log('runMacro(' + keybinding + ')');
        runCommand(gcode);
    }
    
    render(){
        return (
            <Panel collapsible header="Macros" bsStyle="primary" eventKey="3" defaultExpanded={true}>
                <ButtonToolbar>
                    {Object.entries(this.props.macros).map((macro,i)=>{
                        let [keybinding, data] = macro;
                        //return <Button key={i} bsSize="small" onClick={(e)=>this.props.handleMacro(keybinding, this.props.macros)} title={"["+keybinding+"]"}>{data.label}</Button>})
                        return <Button key={i} bsSize="small" onClick={(e)=>this.handleRunMacro(keybinding, this.props.macros)} title={"["+keybinding+"]"}>{data.label}</Button>})
                    }
                </ButtonToolbar>
            </Panel>
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
        handleMacro: (keybinding, macros) => { dispatch(fireMacroById(keybinding, macros))}
    }
}


Macros = connect(mapStateToProps,mapDispatchToProps)(Macros);
MacrosBar = connect(mapStateToProps,mapDispatchToProps)(MacrosBar);
