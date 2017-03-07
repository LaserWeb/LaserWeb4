import React from 'react'
import ReactDOM from 'react-dom'
import { connect, dispatch } from 'react-redux'
import {
    addGroup, setGroupAttrs, deleteGroup, toggleGroupView, toggleGroupEdit,
    addPreset, deletePreset, setPresetAttrs, togglePresetEdit,
    uploadMaterialDatabase, downloadMaterialDatabase,
    applyPreset
} from '../actions/material-database.js'


import * as operation from './operation'

import { Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse, InputGroup } from 'react-bootstrap'
import { FileField } from './forms'

import Icon from './font-awesome';
import stringify from 'json-stringify-pretty-compact';

import { materialTreeToTabular, materialTabularToTree, arr2csv, csv2arr } from '../lib/material-database';

import Select from 'react-select';

import { FileStorage, LocalStorage } from '../lib/storages';

import Validator from 'validatorjs';
import { GlobalStore } from '../index';
import omit from 'object.omit';

import { cast } from '../lib/helpers'

import { AllowCapture } from './capture'
import Splitter from './splitter'

import { alert, prompt, confirm} from './laserweb';

import '../styles/material-database.css'


export const MATERIALDATABASE_VALIDATION_RULES = {
    thickness: 'numeric|min:0.1',
    name: 'required'
}


export function ValidateMaterial(bool = true, rules = MATERIALDATABASE_VALIDATION_RULES, data = null) {

    if (!data)
        data = Object.assign({}, GlobalStore().getState().materialdatabase)

    let check = new Validator(data, rules);

    if (bool)
        return check.passes();

    return check;
}

function MaterialModal({modal, className, header, footer, children, ...rest}) {

    return (
        <Modal show={modal.show} onHide={modal.onHide} bsSize="large" aria-labelledby="contained-modal-title-lg" className={className}>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-lg">{header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : undefined}

        </Modal>
    )

}

let shouldShow = (operation, filter) => {
    if (!filter)
        return true;
    if (filter === "*" || operation.machine_profile === null)
        return true;

    return filter.split(",").includes(operation.machine_profile)

}




class MaterialMachineProfile extends React.Component {

    render() {
        let {profiles, selected, onChange, blank = "*", label = "Profile Filter", ...rest} = this.props;
        let options = Object.entries(profiles).map((entry) => { let [value, item] = entry; return { value, label: item.machineLabel } });
        return <Select multi simpleValue delimiter="," value={selected} placeholder={label} options={options} onChange={(v) => { onChange(v) }} />
    }

}

MaterialMachineProfile = connect((state)=>{return {profiles: state.machineProfiles}})(MaterialMachineProfile)


class MaterialDatabaseEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = { selected: this.props.selectedProfile, materialId: null }

        this.handleDelGroup.bind(this)
        this.handleGroupEditToggle.bind(this)
        this.handleSelectGroup.bind(this)
        this.handleProfileSelect.bind(this)
        this.handleChangePreset.bind(this)
        this.handleChangeGroup.bind(this)
        this.handleExport.bind(this)
        this.handleGroupTemplateClone.bind(this)
    }

    handleProfileSelect(value) {
        this.setState({ selected: value })
    }

    handleGroupEditToggle(id) {
        this.props.handleGroupEditToggle(id)
    }

    handleDelGroup(id) {
        this.props.handleDelGroup(id)
        this.setState({ ...this.state, materialId: null })
    }

    handleChangePreset(id, attrs) {
        this.props.handleChangePreset(id, attrs);
    }

    handleExport(e, format) {
        this.props.handleDownload(this.props.groups, format)
    }

    handleSelectGroup(id) {
        this.setState({ materialId: id })
    }

    handleChangeGroup(id, attrs) {
        this.props.handleChangeGroup(id, attrs)
    }

    handleGroupTemplateClone(fromId, toId){
        let from;
        if (from=getMaterialDbGroup(this.props.groups,fromId))
            this.props.handleGroupTemplateClone(from.template, toId)
    }

    render() {

        return (
            <MaterialModal modal={{ show: this.props.show, onHide: this.props.onHide }} className='full-width'
                header="Material Database"
                footer={<ButtonToolbar>
                    <Button bsStyle="info" onClick={(e) => this.handleExport(e, 'json')}><Icon name="download" /> .json</Button>
                    <Button bsStyle="info" disabled={true} title="Soon :P" onClick={(e) => this.handleExport(e, 'csv')}><Icon name="download" /> .csv</Button>
                    <FileField label="" dispatch={(e) => this.props.handleUpload(e.target.files[0], uploadMaterialDatabase)} buttonClass="btn btn-danger" />
                </ButtonToolbar>}
            >
                <MaterialMachineProfile profiles={this.props.profiles} selected={this.state.selected} onChange={(value) => { this.handleProfileSelect(value) }} />

                <AllowCapture className="paneSizer" >
                    <div className="paneContainer" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <GroupsPane style={{ flexGrow: 0, flexShrink: 0, position: 'relative' }}
                            onMaterialSelected={(id) => this.handleSelectGroup(id)}
                            itemId={this.state.materialId}
                            onGroupAdd={(e) => this.props.handleAddGroup()}
                            onGroupDelete={(id) => this.handleDelGroup(id)}
                        />
                        <PresetsPane style={{ flexGrow: 1 }}
                            groupId={this.state.materialId} selectedProfile={this.state.selected}
                            onGroupEdit={(id) => this.handleGroupEditToggle(id)}
                            onGroupChange={(id, attrs) => this.handleChangeGroup(id, attrs)}
                            onPresetAdd={(id) => this.props.handleAddPreset(id)}
                            onPresetChange={(id, attrs) => this.handleChangePreset(id, attrs)}
                            onPresetDelete={(id) => this.props.handleDelPreset(id)}
                            onPresetEdit={(id) => this.props.handlePresetEditToggle(id)}
                            onGroupTemplateClone={(fromId, toId) => this.handleGroupTemplateClone(fromId, toId)}
                        />
                    </div>
                </AllowCapture>

            </MaterialModal>
        )

    }

}

class GroupsPane extends React.Component {

    render() {
        return <div id="groupsPane" className="full-height" style={this.props.style}>
            <Splitter split="vertical" initialSize={300} splitterId="groupsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
                <div className="full-height innerPane"  >
                    <div className="paneToolbar">
                        <h5>Groupings</h5>
                        <Button onClick={e => this.props.onGroupAdd()} bsSize="xs" bsStyle="success"><Icon name="plus" /> Add</Button>
                        <Button onClick={e => this.props.onGroupDelete(this.props.itemId)} bsSize="xs" bsStyle="danger" disabled={this.props.itemId ? false : true}><Icon name="trash" /> Delete</Button>
                    </div>
                    <div className="listing">
                        {this.props.items.map((item, i) => {
                            return <heading id={item.id} key={i} onClick={(e) => this.props.onMaterialSelected(item.id)} className={(this.props.itemId == item.id) ? 'active' : undefined}>
                                <h5>{item.name}</h5>
                                <small>{item.notes}</small>
                            </heading>
                        })}
                    </div>

                </div>

            </Splitter>
        </div>
    }
}

GroupsPane = connect(
    state => {
        return {
            items: state.materialDatabase
        }
    },
    dispatch => {
        return {}
    }

)(GroupsPane)


class PresetActions extends React.Component {

    constructor(props) {
        super(props)
        this.state = { selected: null }
    }
    render() {

        return <FormGroup>
            <InputGroup>
                <InputGroup.Button><Button disabled={this.props.disabled} onClick={(e) => { this.props.onCloneTo(this.props.groupId, this.state.selected) }} bsStyle="success" title="Clones current template to other Group" ><Icon name="clone" /> Clone to</Button></InputGroup.Button>
                <FormControl componentClass="select" placeholder="type" onChange={(e) => this.setState({ selected: e.target.value })} disabled={this.props.disabled}>
                    <option></option>
                    {this.props.groups.map((group, i) => { if (this.props.groupId !== group.id) return <option key={i} value={group.id}>{group.name}</option> })}
                </FormControl>

            </InputGroup>
        </FormGroup>
    }
}

class PresetsPane extends React.Component {
    render() {
        let groupId = this.props.groupId;
        let item = getMaterialDbGroup(this.props.groups, groupId)
        let heading, presets = [], leftToolbar, rightToolbar, template, actions;
        if (item) {

            if (item.isEditable) {
                heading = (<div className="operationHeading isEditable">
                    <fieldset>
                        <legend>Grouping</legend>
                        <FormGroup>
                            <ControlLabel>Name</ControlLabel>
                            <FormControl
                                type="text"
                                value={item.name}
                                placeholder="Name of the Operation Group"
                                onChange={(e) => { this.props.onGroupChange(this.props.groupId, { name: e.target.value }) }}
                            />
                            <FormControl.Feedback />
                        </FormGroup>

                        <FormGroup>
                            <ControlLabel>Notes</ControlLabel>
                            <FormControl componentClass="textarea" placeholder="notes" value={item.notes} onChange={(e) => { this.props.onGroupChange(this.props.groupId, { notes: e.target.value }) }} />
                            <FormControl.Feedback />
                        </FormGroup>
                    </fieldset>
                    <fieldset>
                        <legend>Default Template</legend>

                        <PresetOperationSettings operation={item.template} caption="Settings" isEditable={true}
                            onCellChange={(id, attrs) => { this.props.onGroupChange(this.props.groupId, { template: attrs }) }} />

                        <PresetOperationParameters operation={item.template} caption="Parameters" isEditable={true}
                            onCellChange={(id, attrs) => { this.props.onGroupChange(this.props.groupId, { template: attrs }) }} />


                    </fieldset>



                </div>)
            } else {
                heading = (<div className="operationHeading">
                    <h3>{item.name}</h3>{item.notes ? (<p>{item.notes}</p>) : undefined}

                    <PresetOperationSettings operation={item.template} caption="Settings" />
                    <PresetOperationParameters operation={item.template} caption="Parameters" />


                </div>)
            }


            leftToolbar = (<div className="paneToolbar">
                <h5>Group</h5>
                <Button onClick={(e) => { this.props.onGroupEdit(this.props.groupId) }}
                                        bsSize="xsmall" bsStyle={item.isEditable? "primary": "warning"} >
                                        {item.isEditable ? <span><Icon name="floppy-o" /> Save</span> : <span><Icon name="pencil" /> Edit</span>}
                                </Button>
            </div>)

            rightToolbar = (<div className="paneToolbar">
                <h5>Presets</h5>
                <Button bsSize="xsmall" bsStyle="success" onClick={(e) => { this.props.onPresetAdd(this.props.groupId) }}><Icon name="plus" /> Add</Button>
            </div>)

            presets = item.presets;

            actions = <div className="paneToolbar">
                <PresetActions groups={this.props.groups} groupId={this.props.groupId} disabled={item.isEditable} onCloneTo={(from, to) => this.props.onGroupTemplateClone(this.props.groupId, to)} />
            </div>

        }

        return <div className="full-height" id="operationsPane" style={this.props.style}>

            <Splitter split="vertical" initialSize={300} splitterId="operationsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
                <div className="full-height left innerPane" >{leftToolbar}{heading}{actions}</div>
            </Splitter>

            <div className="full-height right innerPane">
                {rightToolbar}
                <PanelGroup defaultActiveKey="0" style={{ overflow: 'auto', flexGrow: 10 }}>
                    {presets.map((operation, i) => {
                        if (!shouldShow(operation, this.props.selectedProfile)) return;

                        return <Details className={operation.isEditable ? "editable" : ""} key={i} open={operation.isEditable}
                            handler={<h4>{`${operation.name} (${operation.type})`} <div><small>{operation.notes}</small></div></h4>}
                            header={<div>
                                <Button onClick={(e) => { this.props.onPresetEdit(operation.id) }}
                                        bsSize="xsmall" bsStyle={operation.isEditable? "primary": "warning"} >
                                        {operation.isEditable ? <span><Icon name="floppy-o" /> Save</span> : <span><Icon name="pencil" /> Edit</span>}
                                </Button>

                                <Button onClick={(e) => { this.props.onPresetDelete(operation.id) }} bsSize="xsmall" bsStyle="danger"><Icon name="trash" /> Delete</Button>
                            </div>} >
                            <PresetOperationSettings operation={operation} isEditable={operation.isEditable}
                                onCellChange={(id, attrs) => { this.props.onPresetChange(id, attrs) }}
                                caption="Settings" />

                            <PresetOperationParameters operation={operation} isEditable={operation.isEditable}
                                onCellChange={(id, attrs) => { this.props.onPresetChange(id, attrs) }}
                                caption="Parameters" />
                        </Details>
                    })}
                </PanelGroup>
            </div>
        </div>
    }
}

PresetsPane = connect(
    state => {
        return {
            groups: state.materialDatabase
        }
    },
    dispatch => {
        return {}
    }

)(PresetsPane)


class PresetOperationSettings extends React.Component {

    render() {
        let result = "";
        let op = this.props.operation;
        let OPDEF = operation.types;
        if (this.props.isEditable) {
            result = (<div>

                <FormGroup>
                    <ControlLabel>Name</ControlLabel>
                    <FormControl
                        type="text"
                        value={op.name}
                        placeholder="Name"
                        onChange={(e) => this.props.onCellChange(op.id, { name: e.target.value })}
                    />
                    <FormControl.Feedback />
                </FormGroup>

                <FormGroup>
                    <ControlLabel>Notes</ControlLabel>
                    <FormControl componentClass="textarea" placeholder="Notes" value={op.notes ? op.notes : ""} onChange={(e) => this.props.onCellChange(op.id, { notes: e.target.value })} />
                    <FormControl.Feedback />
                </FormGroup>

                <FormGroup>
                    <ControlLabel>Machine profile</ControlLabel>
                    <MaterialMachineProfile label="Machine profile" onChange={(v)=>{this.props.onCellChange(op.id, { machine_profile: v })}} selected={op.machine_profile} />
                </FormGroup>
                <FormGroup>
                    <ControlLabel>Type</ControlLabel>
                    <FormControl componentClass="select" placeholder="type" value={op.type} onChange={(e) => this.props.onCellChange(op.id, { type: e.target.value })}>
                        {Object.keys(OPDEF).map((option, i) => { return <option key={i} value={option}>{option}</option> })}
                    </FormControl>
                    <FormControl.Feedback />
                </FormGroup>

            </div>)

        } else {
            result = (<table className="table table-compact">
                <caption>{this.props.caption}</caption>
                <tbody>
                    <tr><th>Type</th><td>{op.type}</td></tr>
                    <tr><th>Profile</th><td>{op.machine_profile}</td></tr>
                </tbody>
            </table>)
        }

        return result;

    }
}

const OMIT_FIELDS_EDITION=['name','filterFillColor', 'filterStrokeColor']

class PresetOperationParameters extends React.Component {

    render() {
        const OP = this.props.operation;
        const OPDEF = operation.types[this.props.operation.type]
        const fields = {};

        OPDEF.fields.filter((field)=> { return !OMIT_FIELDS_EDITION.includes(field)}).forEach((key) => {

            const PARAMDEF = operation.fields[key];
            let FieldType = PARAMDEF.input
            
            let error=undefined;
            let className = [FieldType.name];

            if (PARAMDEF.check && !PARAMDEF.check(OP.params[PARAMDEF.name], this.props.settings, OP) && (!PARAMDEF.condition || PARAMDEF.condition(OP, this.props.settings))) 
                error = (typeof PARAMDEF.error=='function') ? PARAMDEF.error(OP.params[PARAMDEF.name], this.props.settings, OP):  PARAMDEF.error

            if (error!==undefined)
                className.push("has-error")

            if (OP.isEditable || this.props.isEditable) {
                //writes operation.params[i][key]
                fields[key] = <div className={className.join(" ")} title={error}>
                    <FieldType key={PARAMDEF.name} op={OP.params} field={PARAMDEF} style={{}}
                        onChangeValue={(v) => { this.props.onCellChange(this.props.operation.id, { params: { [key]: v } }) }} />
                </div>
            } else {
                fields[key] = <div className={className.join(" ")} title={error}>{cast(OP.params[PARAMDEF.name], "---")}</div>

            }
        });

        return <div>
            {this.props.children}
            <table className="table table-compact">
                {this.props.caption ? (<caption>{this.props.caption}</caption>) : undefined}
                <tbody>
                    {Object.entries(fields).map((entry, i) => {
                        let [key, field] = entry;
                        return (<tr key={i}><th>{operation.fields[key].label}</th><td>{React.cloneElement(field)}</td></tr>);
                    })}
                </tbody>
            </table></div>
    }
}

PresetOperationParameters = connect((state) => { return { settings: state.settings } })(PresetOperationParameters)



class Details extends React.Component {

    constructor(props) {
        super(props);
        this.state = { open: this.props.open || false }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.open !== undefined)
            this.setState({ ...this.state, open: nextProps.open || this.state.open })
    }

    render() {
        return <div className={"details " + (this.props.className ? this.props.className : "")}>
            <heading>

                <div className="summary" onClick={() => this.setState({ open: !this.state.open })}><Icon name={this.state.open ? 'chevron-up' : 'chevron-down'} />&nbsp;{this.props.handler}</div>
                {this.props.header}
            </heading>
            <Collapse in={this.state.open}>
                <div className="content">{this.props.children}</div>
            </Collapse>
        </div>

    }

}



class MaterialDatabasePicker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedProfile: this.props.selectedProfile,
        }
        this.handleProfileSelect.bind(this);
        this.handleApplyPreset.bind(this);
    }

    handleProfileSelect(value) {
        this.setState({ selectedProfile: value })
    }

    handleApplyPreset(operationId) {
        if (this.props.onApplyPreset)
            this.props.onApplyPreset(operationId)
    }

    explainOperation(op) {

        const OPERATION_TYPES = operation.types;
        const OPERATION_FIELDS = operation.fields;

        let currentOperation = OPERATION_TYPES[op.type];
        return currentOperation.fields.map((field) => {
            return {
                label: OPERATION_FIELDS[field].label,
                key: OPERATION_FIELDS[field].name,
                value: op.params[field],
                units: OPERATION_FIELDS[field].units
            }
        })
    }

    render() {

        return (
            <MaterialModal modal={{ show: this.props.show, onHide: this.props.onHide }}
                header="Operation Presets">
                <MaterialMachineProfile selected={this.state.selectedProfile} onChange={(value) => { this.handleProfileSelect(value) }} />
                <div className="materialPicker">
                    {this.props.groups.map((item, i) => {
                        return <section key={i}>
                            <heading>
                                <h4>{item.name}</h4>
                                <small>{item.notes}</small>
                            </heading>

                            {item.presets.map((op, j) => {
                                if (shouldShow(op, this.state.selectedProfile)) {
                                    return <Details key={j}
                                        handler={<div className="handler"><strong>{op.name}</strong><small>{op.type}</small></div>}
                                        header={<Button bsStyle="success" bsSize="xsmall" onClick={(e) => { this.handleApplyPreset(op.id) }}><Icon name="share" /></Button>}
                                    >
                                        <table className="table table-sm">
                                            <tbody>
                                                {this.explainOperation(op).map((field, k) => {
                                                    return <tr key={k}><th title={field.key}>{field.label}{field.units ? " (" + field.units + ")" : undefined}</th><td>{cast(field.value, '')}</td></tr>
                                                })}
                                            </tbody>
                                        </table>
                                    </Details>
                                }
                            })}
                        </section>
                    })}
                </div>
            </MaterialModal>
        )
    }

}


const mapStateToProps = (state) => {

    return {
        profiles: state.machineProfiles,
        groups: state.materialDatabase,
        selectedProfile: state.settings.__selectedProfile || "*"
    }

}

const mapDispatchToProps = (dispatch) => {
    return {
        handleAddGroup: () => {
            dispatch(addGroup())
        },
        handleDelGroup: (id) => {
            confirm("Are you sure?",(b)=>{
                if (b) dispatch(deleteGroup(id))
            })
        },
        handleGroupEditToggle: (id) => {
            dispatch(toggleGroupEdit(id))
        },
        handleAddPreset: (id) => {
            dispatch(addPreset(id))
        },
        handleDelPreset: (id) => {
            confirm("Are you sure?",(b)=>{
                if (b) dispatch(deletePreset(id))
            })
        },
        handleChangePreset: (id, attrs) => {
            dispatch(setPresetAttrs(id, attrs))
        },
        handleChangeGroup: (id, attrs) => {
            dispatch(setGroupAttrs(id, attrs))
        },
        handlePresetEditToggle: (id) => {
            dispatch(togglePresetEdit(id))
        },
        handleGroupTemplateClone: (template, toId) => {
            dispatch(setGroupAttrs(toId, { template }))
        },
        handleDownload: (groups, format) => {
            if (format == 'json') {
                FileStorage.save('laserweb-groups', stringify(groups), "application/json");
            } else if (format == 'csv') {
                FileStorage.save('laserweb-groups', arr2csv(materialTreeToTabular(groups)), "text/csv");
            }
            dispatch(downloadMaterialDatabase(groups))
        },
        handleUpload: (name, action) => {
            FileStorage.load(name, (file, result) => dispatch(action(file, result)));
        }

    }
}

MaterialDatabaseEditor = connect(mapStateToProps, mapDispatchToProps)(MaterialDatabaseEditor)
MaterialDatabasePicker = connect(mapStateToProps, mapDispatchToProps)(MaterialDatabasePicker)




export class MaterialDatabaseButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = { showModal: false }
    }

    render() {
        let closeModal = () => this.setState({ showModal: false });

        return (
            <Button bsStyle="primary" block onClick={() => this.setState({ showModal: true })}>{this.props.children}<MaterialDatabaseEditor show={this.state.showModal} onHide={closeModal} /></Button>
        )
    }
}

const getMaterialDbGroup = (state, id) => {
    return state.find(group => group.id === id);
}
const getMaterialDbPreset = (state, id) => {
    let found = null;
    state.forEach((group) => {
        let f = group.presets.find((preset) => { return preset.id === id });
        if (f) found = f;
    })
    return found;
}

export class MaterialPickerButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showModal: false }
        this.handleApplyPreset.bind(this);
    }

    handleApplyPreset(operationId) {

        let operation = getMaterialDbPreset(this.props.groups, operationId)

        this.props.onApplyPreset(operation.type, omit(operation.params, (val, key) => {
            return val !== undefined && val !== null;
        }))
        this.setState({ showModal: false });
    }

    render() {
        let closeModal = () => this.setState({ showModal: false });

        return (
            <Button bsStyle="primary" className={this.props.className} onClick={() => this.setState({ showModal: true })}>{this.props.children}
                <MaterialDatabasePicker show={this.state.showModal} onHide={closeModal} onApplyPreset={(operationId) => { this.handleApplyPreset(operationId) }} />
            </Button>
        )
    }
}

MaterialPickerButton = connect((state) => {
    return {
        groups: state.materialDatabase
    }
})(MaterialPickerButton)
