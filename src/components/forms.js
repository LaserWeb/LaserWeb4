import React from 'react';
import { connect } from 'react-redux';

import Toggle from "react-toggle";
import 'react-toggle/style.css';
import '../styles/forms.css';

import { Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox } from 'react-bootstrap';

export function NumberField({object, field, description, units, setAttrs, dispatch, ...rest}) {
    
    let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
    let errors= hasErrors? rest.errors[field].join(". ") :null; delete rest.errors;
    
    let tooltip = <Tooltip id={"toolip_"+field} >{errors}</Tooltip>;
   
    let input = <InputGroup>
        <InputGroup.Addon>{description}</InputGroup.Addon>
        <FormControl type="number" onChange={e => dispatch(setAttrs({ [field]: Number(e.target.value) }, object.id))} value={object[field]} {...rest} />
        {errors ? <FormControl.Feedback /> : undefined}
        <InputGroup.Addon>{units}</InputGroup.Addon>

      </InputGroup>;
      
    
    return (
        <FormGroup validationState={errors? "error": undefined }>
        {errors? <OverlayTrigger  placement="right" overlay={tooltip} >{input}</OverlayTrigger> : input}
        </FormGroup>
    );
}

export function TextField({object, field, description, units="", setAttrs, dispatch, ...rest}) {
    let isTextArea=typeof(rest.rows)!="undefined";
    let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
    let errors= hasErrors? rest.errors[field].join(". "):null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_"+field} >{errors}</Tooltip>;
    let input = <InputGroup style={{width:"100%"}}>
            {(!isTextArea) ? (<InputGroup.Addon>{description}</InputGroup.Addon>): ( <label htmlFor={field}>{description}</label>)}
            {(!isTextArea) ? (
            <FormControl
                type="text"
                value={object[field]}
                onChange={e => dispatch(setAttrs({ [field]: e.target.value }, object.id))}
                {...rest}
                />
            ) : (
               
                <FormControl componentClass="textarea" id={field}
                onChange={e => dispatch(setAttrs({ [field]: e.target.value }, object.id))}
                value={object[field]}
                {...rest}
                />
            )}
            {(units!=="")? <InputGroup.Addon>{units}</InputGroup.Addon>:(undefined)}
                
        </InputGroup>;
    return (
        <FormGroup validationState={errors? "error": undefined }>
        {errors? <OverlayTrigger  placement="right" overlay={tooltip} >{input}</OverlayTrigger> : input}
        </FormGroup>
    );
}

export function ToggleField({object, field, description, units="", setAttrs, dispatch, ...rest}) {
    let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
    let errors= hasErrors? rest.errors[field].join(". "):null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_"+field} >{errors}</Tooltip>;
    let input = <div className="input-group">
        <Toggle id={"toggle_"+object.id+"_"+field} defaultChecked={object[field]==true} onChange={e => dispatch(setAttrs({  [field]: e.target.checked }, object.id))} />
        <label htmlFor={"toggle_"+object.id+"_"+field}>{description}</label>
        </div>
    return (
        <div className={"form-group "+ (hasErrors? 'has-error':'')}>
        {errors? <OverlayTrigger placement="right" overlay={tooltip}  trigger={[]}>{input}</OverlayTrigger> : input}
        </div>
    )    
}

export function QuadrantField({object, field, description, setAttrs, dispatch, ...rest}) {
    let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
    let errors= hasErrors? rest.errors[field].join(". "):null; delete rest.errors        ;
        
    let radios=["TL","TR","C","BL","BR"];
    let available= new Set(rest.available ? rest.available : radios);
    let fields=radios.map((radio) =>
       <label  key={radio} className={radio}><input type="radio"  value={radio} name={"quadrant_"+field}
       checked={(object[field]==radio)? "checked":""}
       disabled={available.has(radio)? "":"disabled"}
       onChange={e => dispatch(setAttrs({ [field]: e.target.value }, object.id))} />
       </label>
    );
    
    return (
        <div className={"form-group "+ (hasErrors? 'has-error':'')}>
        <div className="input-group">
            <label>{description}</label>
            <div className="quadrantField">{fields}</div>
            
        </div>
        <p className="help-block">{errors}</p>
        </div>
    )
}


export function FileField({label, dispatch, buttonClass="btn", icon="fa-upload", ...rest}) {
    return(
        
        <div style={{position:"relative", display:"inline-block", margin:0, padding:0, border:"none", overflow:"hidden"}} {...rest}>
                <button type="button" className={buttonClass} >{label} <span className={"fa fa-fw "+icon} aria-hidden="true"></span></button>
                <input onChange={dispatch} type="file" value="" style={{position:"absolute", left: 0, top:0, height:"100%", opacity:0, width:150}} />
        </div>
    )
}

export class CheckBoxListField extends React.Component{
    
    constructor(props) {
        super(props);
        this.state={checked:[]}
        this.handleChange.bind(this);
        
    }
    
    render(){
        let checks=[];
        let checked = this.state.checked;
        this.props.data.forEach(o => {checks.push(<Checkbox key={o} value={checked.indexOf(o)!==false} onChange={(e)=>{this.handleChange(e,o)}}>{o}</Checkbox>)})
        return (
            <div className="checkboxListField">{checks}</div>
        )
    }
    
    handleChange(e,key){
        let value=e.target.checked;
        let state=this.state.checked.filter((o)=>{return o!==key});
        if (value) {
            state.push(key);
        }
        this.setState({checked:state})
        
        if (this.props.onChange) 
            this.props.onChange(state);
        
        
        
    }
    
   
}


NumberField = connect()(NumberField);
TextField = connect()(TextField);
ToggleField = connect()(ToggleField);
QuadrantField = connect()(QuadrantField);
CheckBoxListField = connect()(CheckBoxListField);
