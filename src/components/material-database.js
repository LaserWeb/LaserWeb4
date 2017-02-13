import React from 'react'
import ReactDOM from 'react-dom'
import { connect, dispatch } from 'react-redux'
import {
    addBranch, setBranchAttrs, deleteBranch, toggleBranchView, toggleBranchEdit,
    addLeaf, deleteLeaf, setLeafAttrs, toggleLeafEdit,
    uploadMaterialDatabase, downloadMaterialDatabase,
    applyMaterial
} from '../actions/material-database.js'


import * as operation from './operation'

import { Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse, InputGroup } from 'react-bootstrap'
import { FileField } from './forms'

import * as FlexData from 'react-flex-data';
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

        this.handleDelBranch.bind(this)
        this.handleBranchEditToggle.bind(this)
        this.handleSelectBranch.bind(this)
        this.handleProfileSelect.bind(this)
        this.handleChangeLeaf.bind(this)
        this.handleChangeBranch.bind(this)
        this.handleExport.bind(this)
        this.handleBranchTemplateClone.bind(this)
    }

    handleProfileSelect(value) {
        this.setState({ selected: value })
    }

    handleBranchEditToggle(id) {
        this.props.handleBranchEditToggle(id)
    }

    handleDelBranch(id) {
        this.props.handleDelBranch(id)
        this.setState({ ...this.state, materialId: null })
    }

    handleChangeLeaf(id, attrs) {
        this.props.handleChangeLeaf(id, attrs);
    }

    handleExport(e, format) {
        this.props.handleDownload(this.props.materials, format)
    }

    handleSelectBranch(id) {
        this.setState({ materialId: id })
    }

    handleChangeBranch(id, attrs) {
        this.props.handleChangeBranch(id, attrs)
    }

    handleBranchTemplateClone(fromId, toId){
        let from;
        if (from=getMaterialDbBranch(this.props.materials,fromId))
            this.props.handleBranchTemplateClone(from.template, toId)
    }

    render() {

        return (
            <MaterialModal modal={{ show: this.props.show, onHide: this.props.onHide }} className='full-width'
                header="Material Database"
                footer={<ButtonToolbar>
                    <Button bsStyle="info" onClick={(e) => this.handleExport(e, 'json')}><Icon name="download" /> .json</Button>
                    <Button bsStyle="info" onClick={(e) => this.handleExport(e, 'csv')}><Icon name="download" /> .csv</Button>
                    <FileField label="" dispatch={(e) => this.props.handleUpload(e.target.files[0], uploadMaterialDatabase)} buttonClass="btn btn-danger" />
                </ButtonToolbar>}
            >
                <MaterialMachineProfile profiles={this.props.profiles} selected={this.state.selected} onChange={(value) => { this.handleProfileSelect(value) }} />

                <AllowCapture className="paneSizer" >
                    <div className="paneContainer" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <BranchesPane style={{ flexGrow: 0, flexShrink: 0, position: 'relative' }}
                            onMaterialSelected={(id) => this.handleSelectBranch(id)}
                            itemId={this.state.materialId}
                            onBranchAdd={(e) => this.props.handleAddBranch()}
                            onBranchDelete={(id) => this.handleDelBranch(id)}
                        />
                        <LeafsPane style={{ flexGrow: 1 }}
                            branchId={this.state.materialId} selectedProfile={this.state.selected}
                            onBranchEdit={(id) => this.handleBranchEditToggle(id)}
                            onBranchChange={(id, attrs) => this.handleChangeBranch(id, attrs)}
                            onLeafAdd={(id) => this.props.handleAddLeaf(id)}
                            onLeafChange={(id, attrs) => this.handleChangeLeaf(id, attrs)}
                            onLeafDelete={(id) => this.props.handleDelLeaf(id)}
                            onLeafEdit={(id) => this.props.handleLeafEditToggle(id)}
                            onBranchTemplateClone={(fromId, toId) => this.handleBranchTemplateClone(fromId, toId)}
                        />
                    </div>
                </AllowCapture>

            </MaterialModal>
        )

    }

}

class BranchesPane extends React.Component {

    render() {
        return <div id="materialsPane" className="full-height" style={this.props.style}>
            <Splitter split="vertical" initialSize={300} splitterId="materialsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
                <div className="full-height innerPane"  >
                    <div className="paneToolbar">
                        <h5>Groupings</h5>
                        <Button onClick={e => this.props.onBranchAdd()} bsSize="xs" bsStyle="success"><Icon name="plus" /> Add</Button>
                        <Button onClick={e => this.props.onBranchDelete(this.props.itemId)} bsSize="xs" bsStyle="danger" disabled={this.props.itemId ? false : true}><Icon name="trash" /> Delete</Button>
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

BranchesPane = connect(
    state => {
        return {
            items: state.materialDatabase
        }
    },
    dispatch => {
        return {}
    }

)(BranchesPane)


class LeafActions extends React.Component {

    constructor(props) {
        super(props)
        this.state = { selected: null }
    }
    render() {

        return <FormGroup>
            <InputGroup>
                <InputGroup.Button><Button disabled={this.props.disabled} onClick={(e) => { this.props.onCloneTo(this.props.branchId, this.state.selected) }} bsStyle="success" title="Clones current template to other Group" ><Icon name="clone" /> Clone to</Button></InputGroup.Button>
                <FormControl componentClass="select" placeholder="type" onChange={(e) => this.setState({ selected: e.target.value })} disabled={this.props.disabled}>
                    <option></option>
                    {this.props.branches.map((branch, i) => { if (this.props.branchId !== branch.id) return <option key={i} value={branch.id}>{branch.name}</option> })}
                </FormControl>

            </InputGroup>
        </FormGroup>
    }
}

class LeafsPane extends React.Component {
    render() {
        let branchId = this.props.branchId;
        let item = getMaterialDbBranch(this.props.branches, branchId)
        let heading, leafs = [], leftToolbar, rightToolbar, template, actions;
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
                                onChange={(e) => { this.props.onBranchChange(this.props.branchId, { name: e.target.value }) }}
                            />
                            <FormControl.Feedback />
                        </FormGroup>

                        <FormGroup>
                            <ControlLabel>Notes</ControlLabel>
                            <FormControl componentClass="textarea" placeholder="notes" value={item.notes} onChange={(e) => { this.props.onBranchChange(this.props.branchId, { notes: e.target.value }) }} />
                            <FormControl.Feedback />
                        </FormGroup>
                    </fieldset>
                    <fieldset>
                        <legend>Default Template</legend>

                        <LeafOperationSettings operation={item.template} caption="Settings" isEditable={true}
                            onCellChange={(id, attrs) => { this.props.onBranchChange(this.props.branchId, { template: attrs }) }} />

                        <LeafOperationParameters operation={item.template} caption="Parameters" isEditable={true}
                            onCellChange={(id, attrs) => { this.props.onBranchChange(this.props.branchId, { template: attrs }) }} />


                    </fieldset>



                </div>)
            } else {
                heading = (<div className="operationHeading">
                    <h3>{item.name}</h3>{item.notes ? (<p>{item.notes}</p>) : undefined}

                    <LeafOperationSettings operation={item.template} caption="Settings" />
                    <LeafOperationParameters operation={item.template} caption="Parameters" />


                </div>)
            }


            leftToolbar = (<div className="paneToolbar">
                <h5>Group</h5>
                <Button bsSize="xsmall" bsStyle="warning" onClick={(e) => { this.props.onBranchEdit(this.props.branchId) }}><Icon name="pencil" /> Edit</Button>
            </div>)

            rightToolbar = (<div className="paneToolbar">
                <h5>Presets</h5>
                <Button bsSize="xsmall" bsStyle="success" onClick={(e) => { this.props.onLeafAdd(this.props.branchId) }}><Icon name="plus" /> Add</Button>
            </div>)

            leafs = item.leafs;

            actions = <div className="paneToolbar">
                <LeafActions branches={this.props.branches} branchId={this.props.branchId} disabled={item.isEditable} onCloneTo={(from, to) => this.props.onBranchTemplateClone(this.props.branchId, to)} />
            </div>

        }

        return <div className="full-height" id="operationsPane" style={this.props.style}>

            <Splitter split="vertical" initialSize={300} splitterId="operationsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
                <div className="full-height left innerPane" >{leftToolbar}{heading}{actions}</div>
            </Splitter>

            <div className="full-height right innerPane">
                {rightToolbar}
                <PanelGroup defaultActiveKey="0" style={{ overflow: 'auto', flexGrow: 10 }}>
                    {leafs.map((operation, i) => {
                        if (!shouldShow(operation, this.props.selectedProfile)) return;

                        return <Details className={operation.isEditable ? "editable" : ""} key={i}
                            handler={<h4>{`${operation.name} (${operation.type})`} <div><small>{operation.notes}</small></div></h4>}
                            header={<div>
                                <Button onClick={(e) => { this.props.onLeafEdit(operation.id) }} bsSize="xsmall" bsStyle="warning"><Icon name="pencil" /> Edit</Button>
                                <Button onClick={(e) => { this.props.onLeafDelete(operation.id) }} bsSize="xsmall" bsStyle="danger"><Icon name="trash" /> Delete</Button>
                            </div>} >
                            <LeafOperationSettings operation={operation} isEditable={operation.isEditable}
                                onCellChange={(id, attrs) => { this.props.onLeafChange(id, attrs) }}
                                caption="Settings" />

                            <LeafOperationParameters operation={operation} isEditable={operation.isEditable}
                                onCellChange={(id, attrs) => { this.props.onLeafChange(id, attrs) }}
                                caption="Parameters" />
                        </Details>
                    })}
                </PanelGroup>
            </div>
        </div>
    }
}

LeafsPane = connect(
    state => {
        return {
            branches: state.materialDatabase
        }
    },
    dispatch => {
        return {}
    }

)(LeafsPane)


class LeafOperationSettings extends React.Component {

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

class LeafOperationParameters extends React.Component {

    render() {
        const OP = this.props.operation;
        const OPDEF = operation.types[this.props.operation.type]
        const fields = {};

        OPDEF.fields.forEach((key) => {

            const PARAMDEF = operation.fields[key];
            let FieldType = PARAMDEF.input

            let hasError = PARAMDEF.check ? !PARAMDEF.check(OP.params[PARAMDEF.name], this.props.settings, OP) : false

            let className = [FieldType.name];

            if (hasError)
                className.push("has-error")

            if (OP.isEditable || this.props.isEditable) {
                //writes operation.params[i][key]
                fields[key] = <div className={className.join(" ")} title={hasError ? PARAMDEF.error : undefined}>
                    <FieldType key={PARAMDEF.name} op={OP.params} field={PARAMDEF} style={{}}
                        onChangeValue={(v) => { this.props.onCellChange(this.props.operation.id, { params: { [key]: v } }) }} />
                </div>
            } else {
                fields[key] = <div className={className.join(" ")} title={hasError ? PARAMDEF.error : undefined}>{cast(OP.params[PARAMDEF.name], "---")}</div>

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

LeafOperationParameters = connect((state) => { return { settings: state.settings } })(LeafOperationParameters)



class Details extends React.Component {

    constructor(props) {
        super(props);
        this.state = { open: this.props.open || false }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.open !== undefined)
            this.setState({ ...this.state, open: nextProps.open })
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
                    {this.props.materials.map((item, i) => {
                        return <section key={i}>
                            <heading>
                                <h4>{item.name}</h4>
                                <small>{item.notes}</small>
                            </heading>

                            {item.leafs.map((op, j) => {
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
        materials: state.materialDatabase,
        selectedProfile: state.settings.__selectedProfile || "*"
    }

}

const mapDispatchToProps = (dispatch) => {
    return {
        handleAddBranch: () => {
            dispatch(addBranch())
        },
        handleDelBranch: (id) => {
            if (confirm("Are you sure?")) dispatch(deleteBranch(id))
        },
        handleBranchEditToggle: (id) => {
            dispatch(toggleBranchEdit(id))
        },
        handleAddLeaf: (id) => {
            dispatch(addLeaf(id))
        },
        handleDelLeaf: (id) => {
            if (confirm("Are you sure?")) dispatch(deleteLeaf(id))
        },
        handleChangeLeaf: (id, attrs) => {
            dispatch(setLeafAttrs(id, attrs))
        },
        handleChangeBranch: (id, attrs) => {
            dispatch(setBranchAttrs(id, attrs))
        },
        handleLeafEditToggle: (id) => {
            dispatch(toggleLeafEdit(id))
        },
        handleBranchTemplateClone: (template, toId) => {
            dispatch(setBranchAttrs(toId, { template }))
        },
        handleDownload: (materials, format) => {
            if (format == 'json') {
                FileStorage.save('laserweb-materials', stringify(materials), "application/json");
            } else if (format == 'csv') {
                FileStorage.save('laserweb-materials', arr2csv(materialTreeToTabular(materials)), "text/csv");
            }
            dispatch(downloadMaterialDatabase(materials))
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

const getMaterialDbBranch = (state, id) => {
    return state.find(branch => branch.id === id);
}
const getMaterialDbLeaf = (state, id) => {
    let found = null;
    state.forEach((branch) => {
        let f = branch.leafs.find((leaf) => { return leaf.id === id });
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

        let operation = getMaterialDbLeaf(this.props.branches, operationId)

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
        branches: state.materialDatabase
    }
})(MaterialPickerButton)
