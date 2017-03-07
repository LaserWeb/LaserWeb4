import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Toggle from "react-toggle";
import 'react-toggle/style.css';
import '../styles/forms.css';
import Select from 'react-select'

import { Tooltip, Overlay, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox, Button } from 'react-bootstrap';
import Icon from './font-awesome';

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
        let {object, field, description, units, setAttrs, dispatch, labelAddon, ...rest} = this.props;

        let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
        let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;

        if (labelAddon !== false) labelAddon = true;


        let input = <InputGroup>
            {labelAddon ? <InputGroup.Addon>{description}</InputGroup.Addon> : undefined}
            <Input Component={FormControl} type="number" onChangeValue={v => dispatch(setAttrs({ [field]: v }, object.id))} value={object[field]} {...rest} />
            {errors ? <FormControl.Feedback /> : undefined}
            {units ? <InputGroup.Addon>{units}</InputGroup.Addon> : undefined}
        </InputGroup>;


        return <TooltipFormGroup validationState={errors ? "error" : undefined}
            validationContent={errors}
            validationPlacement="right">{!labelAddon ? <ControlLabel>{description}</ControlLabel> : undefined}{input}</TooltipFormGroup>

    }
}

export function TextField({object, field, description, units = "", setAttrs, dispatch, labelAddon, ...rest}) {
    if (labelAddon !== false) 
        labelAddon = true;
    let isTextArea = typeof (rest.rows) != "undefined";
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;
    let input = <InputGroup style={{ width: "100%" }}>
    
        {(!isTextArea && labelAddon!==false) ? (<InputGroup.Addon>{description}</InputGroup.Addon>) : undefined}
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
        validationPlacement="right">{!labelAddon || isTextArea ? <ControlLabel>{description}</ControlLabel> : undefined}{input}</TooltipFormGroup>

}

function selectOptions(arr) {
    let result = [];
    Object.entries(arr).forEach((item, i, obj) => {
        let [value, label] = item;
        if (Array.isArray(obj) && !isNaN(value)) value = label;
        result.push({ value, label })
    })
    return result;
}

export class SelectField extends React.Component {


    render() {

        let {object, field, description, units = "", setAttrs, dispatch, data, blank, defaultValue, labelAddon = true, selectProps, ...rest} = this.props;

        let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
        let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
        let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;

        let label = labelAddon ? <InputGroup.Addon>{description}{units ? " (" + units + ")" : undefined}</InputGroup.Addon> : <ControlLabel>{description}{units ? " (" + units + ")" : undefined}</ControlLabel>

        let props = { ...selectProps, options: selectOptions(data), value: object[field] || defaultValue, onChange: (v) => dispatch(setAttrs({ [field]: v.value }, object.id)) }

        let input = <InputGroup>{label}<Select {...props} /></InputGroup>

        return <TooltipFormGroup validationState={errors ? "error" : undefined}
            validationContent={errors}
            validationPlacement="right">{input}</TooltipFormGroup>
    }

}


export function ToggleField({object, field, description, units = "", setAttrs, dispatch, ...rest}) {
    let hasErrors = typeof (rest.errors) !== "undefined" && rest.errors !== null && typeof (rest.errors[field]) !== "undefined";
    let errors = hasErrors ? rest.errors[field].join(". ") : null; delete rest.errors;
    let tooltip = <Tooltip id={"toolip_" + field} >{errors}</Tooltip>;
    let input = <div >
        <Toggle id={"toggle_" + object.id + "_" + field} defaultChecked={object[field] == true} onChange={e => dispatch(setAttrs({ [field]: e.target.checked }, object.id))} />
        <label htmlFor={"toggle_" + object.id + "_" + field}>{description}</label>
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


export function FileField({label, dispatch, buttonClass = "btn", icon = "upload", ...rest}) {
    return (
        <Button bsClass={buttonClass} style={{ position: "relative", display: "inline-block", overflow: "hidden" }} {...rest} >
            {label} <Icon name={icon}/>
            <input onChange={dispatch} type="file" value="" style={{ position: "absolute", left: 0, top: 0, height: "100%", opacity: 0, width: "100%" }} />
        </Button>
    )
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


NumberField = connect()(NumberField);
TextField = connect()(TextField);
ToggleField = connect()(ToggleField);
QuadrantField = connect()(QuadrantField);
CheckBoxListField = connect()(CheckBoxListField);
SelectField = connect()(SelectField);
