import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Toggle from "react-toggle";
import 'react-toggle/style.css';
import '../styles/forms.css';
import Select from 'react-select'

import { Tooltip, Overlay, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox } from 'react-bootstrap';

// <input> for text and number fields
export class Input extends React.Component {
    componentWillMount() {
        this.onChange = this.onChange.bind(this);
        this.setInput = this.setInput.bind(this);
    }

    convert(value) {
        if (this.props.type === 'number')
            return +value || 0;
        else
            return value + '';
    }

    setInput() {
        ReactDOM.findDOMNode(this).value = this.convert(this.props.value);
    }

    onChange(e) {
        this.props.onChangeValue(this.convert(e.target.value));
    }

    componentDidMount() {
        this.setInput();
    }

    componentDidUpdate() {
        let v = this.convert(this.props.value);
        let node = ReactDOM.findDOMNode(this);
        if (this.convert(node.value) != v)
            node.value = v;
    }

    render() {
        let {Component, value, onChangeValue, ...rest} = this.props;
        if (Component)
            return <Component {...rest} onChange={this.onChange} onBlur={this.setInput} />;
        else
            return <input {...rest} onChange={this.onChange} onBlur={this.setInput} />;
    }
};

class TooltipFormGroup extends React.Component {
    componentWillMount() {
        this.handleBlur = this.handleBlur.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.setState({hasFocus: false})
    }
    
    handleBlur(e){
        this.setState({hasFocus:false})
    }
    handleFocus(e){
        this.setState({hasFocus:true})
    }
    
    render(){
        return <FormGroup validationState={this.props.validationState}
            onBlur={(e)=>this.handleBlur(e)}
            onFocus={(e)=>this.handleFocus(e)}
            onMouseEnter={(e)=>this.handleFocus(e)}
            onMouseLeave={(e)=>this.handleBlur(e)}
                
                
            ref="target">
            {this.props.children}
            <Overlay container={this.props.container || undefined} show={this.props.validationContent && this.state.hasFocus? true:false} placement={this.props.validationPlacement} target={() => ReactDOM.findDOMNode(this.refs.target)}>
                <Tooltip id="validation_tooltip" >{this.props.validationContent}</Tooltip>    
            </Overlay>   
        </FormGroup>
    }
}

export class NumberField extends React.Component {
    
    
    render(){
        let {object, field, description, units, setAttrs, dispatch, labelAddon, ...rest} = this.props;
        
        let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
        let errors= hasErrors? rest.errors[field].join(". ") :null; delete rest.errors;
        
        if (labelAddon!==false) labelAddon=true;
        
        
        let input= <InputGroup>
            {labelAddon? <InputGroup.Addon>{description}</InputGroup.Addon> : undefined}
            <Input Component={FormControl} type="number" onChangeValue={v => dispatch(setAttrs({ [field]: v }, object.id))} value={object[field]} {...rest} />
            {errors ? <FormControl.Feedback /> : undefined}
            {units ? <InputGroup.Addon>{units}</InputGroup.Addon> : undefined}
          </InputGroup>;
        
        
        return <TooltipFormGroup validationState={errors? "error": undefined }
                                validationContent={errors}
                                validationPlacement="right">{!labelAddon? <ControlLabel>{description}</ControlLabel>:undefined}{input}</TooltipFormGroup>
        
    }
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
    
    return  <TooltipFormGroup validationState={errors? "error": undefined }
                                validationContent={errors}
                                validationPlacement="right">{input}</TooltipFormGroup>
    
}

function selectOptions(arr){
    let result=[];
    Object.entries(arr).forEach((item,i, obj)=>{
        let [value, label] = item;
        if (Array.isArray(obj) && !isNaN(value)) value = label;
        result.push({value,label})
    })
    return result;
}

export class SelectField extends React.Component  {
    
    
    render(){
        
        let {object, field, description, units="",  setAttrs, dispatch, data, blank, defaultValue, labelAddon=true, selectProps,...rest} = this.props;
        
        let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
        let errors= hasErrors? rest.errors[field].join(". "):null; delete rest.errors;
        let tooltip = <Tooltip id={"toolip_"+field} >{errors}</Tooltip>;
        
        let label = labelAddon? <InputGroup.Addon>{description}{ units? " ("+units+")":undefined }</InputGroup.Addon>: <ControlLabel>{description}{ units? " ("+units+")":undefined }</ControlLabel>
        
        let props={...selectProps, options: selectOptions(data),  value: object[field] || defaultValue, onChange: (v) => dispatch(setAttrs({ [field]: v.value }, object.id))}
        
        let input = <InputGroup>{label}<Select {...props} /></InputGroup>
        
        return  <TooltipFormGroup validationState={errors? "error": undefined }
                                    validationContent={errors}
                                    validationPlacement="right">{input}</TooltipFormGroup>
    }
    
}


export function ToggleField({object, field, description, units="", setAttrs, dispatch, ...rest}) {
    let hasErrors=typeof(rest.errors)!=="undefined" && rest.errors!==null  &&  typeof(rest.errors[field])!=="undefined";
    let errors= hasErrors? rest.errors[field].join(". "):null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_"+field} >{errors}</Tooltip>;
    let input = <div >
        <Toggle id={"toggle_"+object.id+"_"+field} defaultChecked={object[field]==true} onChange={e => dispatch(setAttrs({  [field]: e.target.checked }, object.id))} />
        <label htmlFor={"toggle_"+object.id+"_"+field}>{description}</label>
        </div>
    
    return <TooltipFormGroup validationState={errors? "error": undefined }
                                validationContent={errors}
                                validationPlacement="right">{input}</TooltipFormGroup>
    
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
SelectField = connect()(SelectField);