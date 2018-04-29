import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Toggle from "react-toggle";
import 'react-toggle/style.css';
import '../styles/forms.css';
import Select from 'react-select'

import { Tooltip, Overlay, OverlayTrigger, Popover, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox, Button, Label } from 'react-bootstrap';
import Icon from './font-awesome';

import convert from 'color-convert'

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
        this.setState({ hasFocus: false })
    }

    handleBlur(e) {
        this.setState({ hasFocus: false })
    }
    handleFocus(e) {
        this.setState({ hasFocus: true })
    }

    render() {
        return <FormGroup validationState={this.props.validationState}
            onBlur={(e) => this.handleBlur(e)}
            onFocus={(e) => this.handleFocus(e)}
            onMouseEnter={(e) => this.handleFocus(e)}
            onMouseLeave={(e) => this.handleBlur(e)}


            ref="target">
            {this.props.children}
            <Overlay container={this.props.container || undefined} show={this.props.validationContent && this.state.hasFocus ? true : false} placement={this.props.validationPlacement} target={() => ReactDOM.findDOMNode(this.refs.target)}>
                <Tooltip id="validation_tooltip" >{this.props.validationContent}</Tooltip>
            </Overlay>
        </FormGroup>
    }
}

export class NumberField extends React.Component {


    render() {
        let {object, field, description, units, setAttrs, dispatch, labelAddon, info, ...rest} = this.props;

        let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
        let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;

        if (labelAddon !== false) labelAddon = true;


        let input = <InputGroup>
            {labelAddon ? <InputGroup.Addon>{description}{info}</InputGroup.Addon> : undefined}
            <Input Component={FormControl} type="number" onChangeValue={v => dispatch(setAttrs({ [field]: v }, object.id))} value={object[field]} {...rest} />
            {errors ? <FormControl.Feedback /> : undefined}
            {units ? <InputGroup.Addon>{units}</InputGroup.Addon> : undefined}
            
        </InputGroup>;


        return <TooltipFormGroup validationState={errors ? "error" : undefined}
            validationContent={errors}
            validationPlacement="right">{!labelAddon ? <ControlLabel>{description}{info}</ControlLabel> : undefined}{input}</TooltipFormGroup>

    }
}

export function TextField({object, field, description, units = "", setAttrs, dispatch, labelAddon, info, ...rest}) {
    if (labelAddon !== false) 
        labelAddon = true;
    let isTextArea = typeof (rest.rows) != "undefined";
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;
    let input = <InputGroup style={{ width: "100%" }}>
    
        {(!isTextArea && labelAddon!==false) ? (<InputGroup.Addon>{description}{info}</InputGroup.Addon>) : undefined}
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
        {(units !== "") ? <InputGroup.Addon>{units}</InputGroup.Addon> : (undefined)}

    </InputGroup>;

    return <TooltipFormGroup validationState={errors ? "error" : undefined}
        validationContent={errors}
        validationPlacement="right">{!labelAddon || isTextArea ? <ControlLabel>{description}{info}</ControlLabel> : undefined}{input}</TooltipFormGroup>

}

/* 
    formats ["a","b"] as [{label:"a",value:"a"... }]
    formats { "a": "b", "c":"d"} as [{label:"a", value: "b"},{label:"c":value:"d"}]
    keeps   [{label:"a", value:"b"}]
*/
function selectOptions(arr) {
    let result=[];
    if (!Array.isArray(arr) && typeof arr === 'object') {
        result=Object.entries(arr).map(item=>{ return {value:item[0],label:item[1]}});
    } else {
        arr.forEach(item=>{
            if (typeof item === 'object' && item.hasOwnProperty('label') && item.hasOwnProperty('value')) {
                result.push(item)
            } else {
                result.push({ value:item, label:item })
            }
        })
    }
    return result; 
}
export class SelectField extends React.Component {


    render() {

        let {object, field, description, units = "", setAttrs, dispatch, data, blank, defaultValue, labelAddon = true, selectProps,info, ...rest} = this.props;

        let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
        let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
        let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;

        let label = labelAddon ? <InputGroup.Addon>{description}{units ? " (" + units + ")" : undefined}{info}</InputGroup.Addon> : <ControlLabel>{description}{units ? " (" + units + ")" : undefined}{info}</ControlLabel>

        let props = { ...selectProps, options: selectOptions(data), value: object[field] || defaultValue, onChange: (v) => dispatch(setAttrs({ [field]: v.value }, object.id)) }

        let input = <InputGroup>{label}<Select {...props} /></InputGroup>

        return <TooltipFormGroup validationState={errors ? "error" : undefined}
            validationContent={errors}
            validationPlacement="right">{input}</TooltipFormGroup>
    }

}


export function ToggleField({object, field, description, units = "", setAttrs, dispatch, info, disabled=false, ...rest}) {
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;
    let input = <div >
        <Toggle disabled={disabled} id={"toggle_" + object.id + "_" + field} defaultChecked={object[field] == true} onChange={e => dispatch(setAttrs({ [field]: e.target.checked }, object.id))} />
        <label htmlFor={"toggle_" + object.id + "_" + field}>{description}</label> {info}
    </div>

    return <TooltipFormGroup validationState={errors ? "error" : undefined}
        validationContent={errors}
        validationPlacement="right">{input}</TooltipFormGroup>

}

export function QuadrantField({object, field, description, setAttrs, dispatch, ...rest}) {
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let radios = ["TL", "TR", "C", "BL", "BR"];
    let available = new Set(rest.available ? rest.available : radios);

    let areaClass = (area) => {
        let className = ["area", area.toLowerCase()];

        if (object[field] == area) className.push('active')
        if (!available.has(area)) className.push('disabled')
        return className.join(" ");
    }

    let onClick = (area) => {
        return (e) => {
            if (available.has(area)) dispatch(setAttrs({ [field]: area }, object.id));
        }
    }

    let input = <div>
        <label>{description}</label>
        <svg className="quadrantField" width="65" height="65">
            <path className="bkg" d="M52.8,62.9H10.5c-5.5,0-10-4.5-10-10V10.5c0-5.5,4.5-10,10-10h42.3c5.5,0,10,4.5,10,10v42.3 C62.9,58.4,58.4,62.9,52.8,62.9z" />
            <g className={areaClass('TL')} onClick={onClick('TL')}><circle cx="11.8" cy="11.8" r="9.8" /><path id="XMLID_37_" d="M12.1,9.2h-1.7v7.4H8.5V9.2H6.7V7.4h5.5V9.2z" /><path id="XMLID_39_" d="M12.9,16.6V7.4h1.9v7.4h2.7v1.7H12.9z" /></g>
            <g className={areaClass('TR')} onClick={onClick('TR')}><circle cx="51.5" cy="11.8" r="9.8" /><path id="XMLID_13_" d="M51.1,9.2h-1.7v7.4h-1.9V9.2h-1.8V7.4h5.5V9.2z" /><path id="XMLID_15_" d="M55.5,16.6l-1.1-3.3h-0.5v3.3h-1.9V8.7l1.4-1.3h3.9v5.8h-1l1.2,3.3H55.5z M55.3,11.6V9.2h-1.5v2.4H55.3z" /></g>
            <g className={areaClass('C')} onClick={onClick('C')}><circle cx="31.7" cy="31.7" r="9.8" /><path id="XMLID_19_" d="M32.5,34.7v-1.1h1.9v1.6l-1.3,1.3H29v-7.9l1.4-1.3h4v3.5h-1.9V29h-1.5v5.7H32.5z" /></g>
            <g className={areaClass('BL')} onClick={onClick('BL')}><circle cx="11.8" cy="51.5" r="9.8" /><path id="XMLID_30_" d="M12.3,52.5v3.8H8L6.7,55v-7.9h3.9l1.3,1.2v2.5L11,51.6L12.3,52.5z M10,50.8v-1.9H8.6v1.9H10z M10.3,54.5 v-2.1H8.6v2.1H10.3z" /><path id="XMLID_34_" d="M13.1,56.3v-9.2H15v7.4h2.7v1.7H13.1z" /></g>
            <g className={areaClass('BR')} onClick={onClick('BR')}><circle cx="51.5" cy="51.5" r="9.8" /><path id="XMLID_22_" d="M51.2,52.5v3.8h-4.3L45.6,55v-7.9h3.9l1.3,1.2v2.5l-0.9,0.7L51.2,52.5z M48.9,50.8v-1.9h-1.4v1.9H48.9z M49.2,54.5v-2.1h-1.7v2.1H49.2z" /><path id="XMLID_26_" d="M55.5,56.3L54.4,53h-0.5v3.3H52v-7.9l1.4-1.3h3.9v5.8h-1l1.2,3.3H55.5z M55.4,51.2v-2.4h-1.5v2.4H55.4z" /></g>
        </svg>
    </div>

    return <TooltipFormGroup validationState={errors ? "error" : undefined}
        validationContent={errors}
        validationPlacement="right">{input}</TooltipFormGroup>

};


export class FileField extends React.Component {

    constructor(props) {
        super(props);
        this._domclick = function(ce) {
            ce.preventDefault();
            let modifiers={ ctrl: ce.ctrlKey, shift: ce.shiftKey, meta: ce.metaKey };
            if (this.input.__changeHandler) this.input.removeEventListener('change',this.input.__changeHandler)
            this.input.value="";
            this.input.__changeHandler = (e)=> {
               e.preventDefault();
               this.props.onChange(e,modifiers)
            }
            this.input.addEventListener('change',this.input.__changeHandler)
            this.input.click();
        }.bind(this)
    }

    componentDidMount() {
        this.clicker.addEventListener('click', this._domclick)
    }

    componentWillUnMount() {
        this.clicker.removeEventListener('click', this._domclick)
    }

    render() {
        return <span style={this.props.style} >
            <span ref={(input)=>this.clicker = input}>{this.props.children}</span><input type="file" ref={(input) => { this.input = input }} multiple style={{display:"none"}} accept={this.props.accept} />
        </span>
    }
}

export class CheckBoxListField extends React.Component {

    constructor(props) {
        super(props);
        this.state = { checked: [] }
        this.handleChange.bind(this);

    }

    render() {
        let checks = [];
        let checked = this.state.checked;
        this.props.data.forEach(o => { checks.push(<Checkbox key={o} value={checked.indexOf(o) !== false} onChange={(e) => { this.handleChange(e, o) } }>{o}</Checkbox>) })
        return (
            <div className="checkboxListField">{checks}</div>
        )
    }

    handleChange(e, key) {
        let value = e.target.checked;
        let state = this.state.checked.filter((o) => { return o !== key });
        if (value) {
            state.push(key);
        }
        this.setState({ checked: state })

        if (this.props.onChange)
            this.props.onChange(state);



    }
}

export class InputRangeField extends React.Component {

    constructor(props) {
        super(props);
        this.handleChange.bind(this)
        this.handleNormalize.bind(this)
        this.state = Object.assign({ min: this.props.minValue, max: this.props.maxValue }, this.props.value);
    }

    handleChange(key, v) {
        let state = Object.assign(this.state, { [key]: parseFloat(v) })
            state.min = Math.max(Math.min(this.props.maxValue, state.min), this.props.minValue)
            state.max = Math.max(Math.min(this.props.maxValue, state.max), this.props.minValue)
       
        this.props.onChangeValue(state);
        this.setState(state)
    }

    handleNormalize()
    {
        if (this.props.normalize) {
            let state = Object.assign(this.state, {min: Math.min(this.state.min, this.state.max), max: Math.max(this.state.min, this.state.max)})
                this.props.onChangeValue(state);
                this.setState(state)
        }
            
    }

    render() {
        let { min, max } = this.state;
        return <div>
            <label style={{ whiteSpace: "nowrap" }} >Min <input size="3" onBlur={e=>this.handleNormalize(e)} style={{ display: "inline-block" }} type='number' placeholder={this.props.minValue} min={this.props.minValue} max={this.props.maxValue} step='any' onChange={(e) => this.handleChange('min', e.target.value)} value={min} /></label>
            <label style={{ whiteSpace: "nowrap" }} >Max <input size="3" onBlur={e=>this.handleNormalize(e)} style={{ display: "inline-block" }} type='number' placeholder={this.props.maxValue} max={this.props.maxValue} min={this.props.minValue} step='any' onChange={(e) => this.handleChange('max', e.target.value)} value={max} /></label>
        </div>
    }
}


NumberField = connect()(NumberField);
TextField = connect()(TextField);
ToggleField = connect()(ToggleField);
QuadrantField = connect()(QuadrantField);
CheckBoxListField = connect()(CheckBoxListField);
SelectField = connect()(SelectField);
InputRangeField = connect()(InputRangeField);


export function Info(content,title='Help',alignment='right', trigger="focus") {
    let pop=<Popover id={"popover-positioned-"+alignment} title={title}>{content}</Popover>
    return <OverlayTrigger trigger={trigger} placement="right" overlay={pop}><Button bsSize="xsmall" bsStyle="link" style={{color:"blue", cursor:'pointer'}}><Icon name="question-circle"/></Button></OverlayTrigger>
}

export class ColorPicker extends React.Component{
    constructor(props){
        super(props)
        this.state={color:"#000000"}
        this.handleClick=this.handleClick.bind(this)
    }
    handleClick(modifiers) {
        if (this.props.onClick) {
            if (modifiers.shiftKey) 
                return this.props.onClick(null)

            let value;
            switch(this.props.to){
                default:{
                    value=[...convert.hex.rgb(this.state.color),1]
                }
            }
            this.props.onClick(value)
        }
    }
    render(){
        return <div className={"btn-colorPicker "+(this.props.disabled?"disabled":"")}>
            <ModButton bsSize="xsmall" disabled={this.props.disabled}  bsStyle={this.props.bsStyle} onClick={this.handleClick}>
                <Icon name={this.props.icon} />
                <Icon name={this.props.icon} data-event="shiftKey" data-eventClassName='btn-danger' />
            </ModButton>
            <input disabled={this.props.disabled} type="color" value={this.state.color} onChange={e=>this.setState({color: e.target.value})}/>
        </div>
    }
}

export class ModButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { }
        this.handleClick.bind(this)
        this.onModKey.bind(this)
        this.offModKey.bind(this)
        this.state = {}
        this.__mounted=false;
    }

    onModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
        
    }

    offModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
        
    }

    componentDidMount() {
        this.__mounted=true;
        document.addEventListener('keydown', this.onModKey.bind(this))
        document.addEventListener('keyup', this.offModKey.bind(this))
    }

    componentWillUnmount() {
        this.__mounted=false;
        document.removeEventListener('keydown', this.onModKey.bind(this))
        document.removeEventListener('keyup', this.offModKey.bind(this))
    }

    handleClick(e) {
       if (this.props.onClick)
            this.props.onClick(this.state)
    }

    render() {
        let events=Object.entries(this.state).filter(e=>e[1]).map(e=>e[0]);
        let child= this.props.children.filter(c=>(!c.props['data-event'] || events.includes(c.props['data-event']))).slice().pop();
        let className = this.props.className;
            if (child.props['data-eventClassName']) className += ' '+child.props['data-eventClassName']
        
        return (
            <Button disabled={this.props.disabled} bsStyle={this.props.bsStyle} bsSize={this.props.bsSize || 'small'} className={className} onClick={(e) => this.handleClick(e)}>{child}</Button>
        )
    }
}

export class SearchButton extends React.Component {

    constructor(props)
    {
        super(props);
        this.state={search: this.props.search}
    }

    componentWillReceiveProps(nextProps)
    {
        this.setState({search: nextProps.search})
    }

    render(){

        let pop=<Popover id={"SearchButton_popover"} title={this.props.title || "Search"}><FormGroup>
            <InputGroup>
            <FormControl type="text" value={this.state.search||""} onChange={e=>{this.setState({search:e.target.value})}} />
            <InputGroup.Button>
                <Button bsStyle="primary" onClick={e=>{this.props.onSearch(this.state.search)}}><Icon name="search"/></Button>
                <Button bsStyle="danger" onClick={e=>{this.props.onSearch(null)}}><Icon name="remove"/></Button>
            </InputGroup.Button>
            </InputGroup>
        </FormGroup></Popover>

        return <OverlayTrigger trigger="click" placement={this.props.placement || "top"} overlay={pop}><Button bsStyle={this.props.bsStyle} bsSize={this.props.bsSize}>{this.props.children}</Button></OverlayTrigger>
        
    }
}