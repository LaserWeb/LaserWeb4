import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    addGroup, setGroupAttrs, deleteGroup, toggleGroupView, toggleGroupEdit,
    addPreset, deletePreset, setPresetAttrs, togglePresetEdit,
    uploadMaterialDatabase, downloadMaterialDatabase,
    applyPreset, newPreset
} from '../actions/material-database.js'


import { OPERATION_FIELDS, OPERATION_TYPES } from './operation'

import { Modal, Button, ButtonToolbar, FormControl, ControlLabel, FormGroup, PanelGroup, Collapse, InputGroup } from 'react-bootstrap'
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

import { alert, prompt, confirm } from './laserweb';
import vex from '../lib/vex';

import '../styles/material-database.css'

import { DEFAULT_GROUPING_NAME } from '../reducers/material-database';
import classNames from 'classnames'

export const MATERIALDATABASE_VALIDATION_RULES = {
    thickness: 'numeric|min:0.1',
    name: 'required'
}

export function ValidateMaterial(resultOnly = true, rules = MATERIALDATABASE_VALIDATION_RULES, data = null) {
    let check = new Validator(data ?? {... GlobalStore().getState().materialdatabase}, rules);

    if (resultOnly) {
        return check.passes();
    } else {
        return check;
    }
}

function MaterialModal({ modal, className, header, footer, children, ...rest }) {
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

function shouldShow(operation, filter) {
    if (filter == null || filter === "*" || operation.machine_profile == null) {
        return true;
    } else {
        return filter.split(",").includes(operation.machine_profile)
    }
}

function MaterialMachineProfile({ selected, onChange, label = "Profile Filter" }) {
    let profiles = useSelector((state) => state.machineProfiles);

    let options = Object.entries(profiles)
        .map(([ value, item ]) => ({ value, label: item.machineLabel }));

    return <Select multi simpleValue delimiter="," value={selected} placeholder={label} options={options} onChange={(v) => { onChange(v) }} />
}

function MaterialDatabaseEditor({ show, onHide }) {
    let dispatch = useDispatch();
    let profiles = useSelector((state) => state.profiles);
    let groups = useSelector((state) => state.materialDatabase);
    let selectedProfile = useSelector((state) => state.settings.__selectedProfile ?? "*");

    let [ materialId, setMaterialId ] = useState(null );
    let [ selected, setSelected ] = useState(selectedProfile);

    function confirmDeleteGroup(id) {
        // FIXME(REFACTOR): Unclear error message
        confirm("Are you sure?", (accepted) => {
            if (accepted) {
                dispatch(deleteGroup(id));
                setMaterialId(null);
            }
        });
    }

    function confirmDeletePreset(id) {
        // FIXME(REFACTOR): Unclear error message
        confirm("Are you sure?", (accepted) => {
            if (accepted) {
                dispatch(deletePreset(id));
            }
        });
    }

    function cloneGroupTemplate(fromId, toId) {
        let source = getMaterialDbGroup(groups, fromId);

        if (source != null) {
            dispatch(setGroupAttrs(toId, { template: source.template }));
        }
    }

    function downloadDatabase(format) {
        if (format == 'json') {
            FileStorage.save('laserweb-groups', stringify(groups), "application/json");
        } else if (format == 'csv') {
            FileStorage.save('laserweb-groups', arr2csv(materialTreeToTabular(groups)), "text/csv");
        }

        dispatch(downloadMaterialDatabase(groups));
    }

    function uploadDatabase(file, action) {
        // FIXME(REFACTOR): This FileStorage abstraction seems non-obvious and redundant with manual file reading code in document handling; figure out a way to unify all that into something obvious
         FileStorage.load(file, (file, result) => dispatch(action(file, result)));
    }

    let footer = <ButtonToolbar>
        <Button bsStyle="info" onClick={() => downloadDatabase('json')}><Icon name="download" /> .json</Button>
        <FileField onChange={(e) => uploadDatabase(e.target.files[0], uploadMaterialDatabase)}><Button bsStyle="danger"><Icon name="upload" /></Button></FileField>
    </ButtonToolbar>;

    // FIXME: Probably a lot of these dispatches can be done from directly within subcomponents?
    return (
        <MaterialModal modal={{ show: show, onHide: onHide }} className='full-width' header="Material Database" footer={footer}>
            <MaterialMachineProfile profiles={profiles} selected={selected} onChange={(value) => setSelected(value)} />

            <AllowCapture className="paneSizer" >
                <div className="paneContainer" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                    <GroupsPane style={{ flexGrow: 0, flexShrink: 0, position: 'relative' }}
                        onMaterialSelected={(id) => setMaterialId(id)}
                        itemId={materialId}
                        onGroupAdd={() => dispatch(addGroup())}
                        onGroupDelete={(id) => confirmDeleteGroup(id)}
                    />
                    <GroupView style={{ flexGrow: 1 }}
                        groupId={materialId} selectedProfile={selected}
                        onGroupEdit={(id) => dispatch(toggleGroupEdit(id))}
                        onGroupChange={(id, attrs) => dispatch(setGroupAttrs(id, attrs))}
                        onPresetAdd={(id) => dispatch(addPreset(id))}
                        onPresetChange={(id, attrs) => dispatch(setPresetAttrs(id, attrs))}
                        onPresetDelete={(id) => confirmDeletePreset(id)}
                        onPresetEdit={(id) => dispatch(togglePresetEdit(id))}
                        onGroupTemplateClone={(fromId, toId) => cloneGroupTemplate(fromId, toId)}
                    />
                </div>
            </AllowCapture>
        </MaterialModal>
    )
}

function GroupsPane({ style, itemId, onGroupAdd, onGroupDelete, onMaterialSelected }) {
    let items = useSelector((state) => state.materialDatabase);

    return <div id="groupsPane" className="full-height" style={style}>
        <Splitter split="vertical" initialSize={300} splitterId="groupsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
            <div className="full-height innerPane">
                <div className="paneToolbar">
                    <h5>Groupings</h5>
                    <Button onClick={() => onGroupAdd()} bsSize="xs" bsStyle="success"><Icon name="plus" /> Add</Button>
                    <Button onClick={() => onGroupDelete(itemId)} bsSize="xs" bsStyle="danger" disabled={itemId ? false : true}><Icon name="trash" /> Delete</Button>
                </div>
                <div className="listing">
                    {items.map((item, i) => {
                        // FIXME(REFACTOR): It looks like item._locked is repurposed to also indicate an included preset (giftbox icon) by setting it to `false`? That should really be a separate field for clarity.
                        let header = (item._locked)
                            ? <h5 title="This grouping is locked. Will be reset on next application start.">{item.name} <Icon name="lock" /></h5>
                            : <h5>{item.name} {(item._locked===false ? <Icon name="gift" /> : null)}</h5>;

                        return <div id={item.id} key={i} onClick={() => onMaterialSelected(item.id)} className={(itemId == item.id) ? 'active' : undefined}>
                            {header}
                            <small>{item.notes}</small>
                        </div>
                    })}
                </div>
            </div>
        </Splitter>
    </div>
}

function PresetActions({ disabled, groupId, groups, onCloneTo }) {
    let [ selected, setSelected ] = useState();

    return <FormGroup>
        <InputGroup>
            <InputGroup.Button>
                <Button disabled={disabled} onClick={() => { onCloneTo(groupId, selected) }} bsStyle="success" title="Clones current template to other Group" ><Icon name="clone" /> Clone to</Button>
            </InputGroup.Button>
            <FormControl componentClass="select" placeholder="type" onChange={(e) => setSelected(e.target.value)} disabled={disabled}>
                <option></option>
                {groups.map((group, i) => {
                    if (groupId !== group.id) {
                        return <option key={i} value={group.id}>{group.name}</option>;
                    }
                })}
            </FormControl>

        </InputGroup>
    </FormGroup>;
}

function PresetsPaneToolbarGroup({ groupId, item, onGroupEdit }) {
    return <div className="paneToolbar">
        <h5>Group</h5>
        <Button onClick={() => { onGroupEdit(groupId) }}
            bsSize="xsmall" bsStyle={item.isEditable ? "primary" : "warning"} >
            {item.isEditable ? <span><Icon name="floppy-o" /> Save</span> : <span><Icon name="pencil" /> Edit</span>}
        </Button>
    </div>;
}

function PresetsPaneToolbarPresets({ groupId, onPresetAdd }) {
    return <div className="paneToolbar">
        <h5>Presets</h5>
        <Button bsSize="xsmall" bsStyle="success" onClick={(e) => { onPresetAdd(groupId) }}><Icon name="plus" /> Add</Button>
    </div>;
}

function GroupView(props) {
    let { style, groupId, selectedProfile, onGroupChange, onGroupEdit, onPresetAdd, onPresetChange, onPresetEdit, onPresetDelete } = props;
    let groups = useSelector((state) => state.materialDatabase);
    let item = getMaterialDbGroup(groups, groupId)
    
    let heading, presets = [], leftToolbar, rightToolbar, actions;
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
                            onChange={(e) => { onGroupChange(groupId, { name: e.target.value }) }}
                        />
                        <FormControl.Feedback />
                    </FormGroup>

                    <FormGroup>
                        <ControlLabel>Notes</ControlLabel>
                        <FormControl componentClass="textarea" placeholder="notes" value={item.notes} onChange={(e) => { onGroupChange(groupId, { notes: e.target.value }) }} />
                        <FormControl.Feedback />
                    </FormGroup>
                </fieldset>
                <fieldset>
                    <legend>Default Template</legend>

                    <PresetOperationSettings operation={item.template} caption="Settings" isEditable={true}
                        onCellChange={(id, attrs) => { onGroupChange(groupId, { template: attrs }) }} />

                    <PresetOperationParameters operation={item.template} caption="Parameters" isEditable={true}
                        onCellChange={(id, attrs) => { onGroupChange(groupId, { template: attrs }) }} />

                </fieldset>
            </div>)
        } else {
            heading = (<div className="operationHeading">
                <h3>{item.name}</h3>{item.notes ? (<p>{item.notes}</p>) : undefined}

                <PresetOperationSettings operation={item.template} caption="Settings" />
                <PresetOperationParameters operation={item.template} caption="Parameters" />
            </div>)
        }


        leftToolbar = <PresetsPaneToolbarGroup groupId={groupId} item={item} onGroupEdit={onGroupEdit} />
        rightToolbar = <PresetsPaneToolbarPresets groupId={groupId} onPresetAdd={onPresetAdd} />
        presets = item.presets;

        actions = <div className="paneToolbar">
            <PresetActions groups={groups} groupId={groupId} disabled={item.isEditable} onCloneTo={(from, to) => onGroupTemplateClone(groupId, to)} />
        </div>

    }

    let __presets=presets.filter((operation,i)=>(shouldShow(operation, selectedProfile)))

    return <div className="full-height" id="operationsPane" style={style}>

        <Splitter split="vertical" initialSize={300} splitterId="operationsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
            <div className="full-height left innerPane" >{leftToolbar}{heading}{actions}</div>
        </Splitter>

        <div className="full-height right innerPane">
            {rightToolbar}
            <PanelGroup defaultActiveKey="0" style={{ overflow: 'auto', flexGrow: 10 }}>
                {__presets.map((operation, i) => {
                    return <Details className={operation.isEditable ? "editable" : ""} key={i} open={operation.isEditable}
                        handler={<h4>{`${operation.name} (${operation.type})`} <div><small>{operation.notes}</small></div></h4>}
                        header={<div>
                            <Button onClick={() => { onPresetEdit(operation.id) }}
                                bsSize="xsmall" bsStyle={operation.isEditable ? "primary" : "warning"} >
                                {operation.isEditable ? <span><Icon name="floppy-o" /> Save</span> : <span><Icon name="pencil" /> Edit</span>}
                            </Button>

                            <Button onClick={() => { onPresetDelete(operation.id) }} bsSize="xsmall" bsStyle="danger"><Icon name="trash" /> Delete</Button>
                        </div>} >
                        <PresetOperationSettings operation={operation} isEditable={operation.isEditable}
                            onCellChange={(id, attrs) => { onPresetChange(id, attrs) }}
                            caption="Settings" />

                        <PresetOperationParameters operation={operation} isEditable={operation.isEditable}
                            onCellChange={(id, attrs) => { onPresetChange(id, attrs) }}
                            caption="Parameters" />
                    </Details>
                })}
                { (!__presets.length && selectedProfile.length) ? 'Presets not shown due machine profile filters':undefined }
            </PanelGroup>
        </div>
    </div>
}

function PresetOperationSettings({ caption, operation, isEditable, onCellChange }) {
    if (isEditable) {
        return <div>
            <FormGroup>
                <ControlLabel>Name</ControlLabel>
                <FormControl
                    type="text"
                    value={operation.name}
                    placeholder="Name"
                    onChange={(e) => onCellChange(operation.id, { name: e.target.value })}
                />
                <FormControl.Feedback />
            </FormGroup>

            <FormGroup>
                <ControlLabel>Notes</ControlLabel>
                <FormControl componentClass="textarea" placeholder="Notes" value={operation.notes ? operation.notes : ""} onChange={(e) => onCellChange(operation.id, { notes: e.target.value })} />
                <FormControl.Feedback />
            </FormGroup>

            <FormGroup>
                <ControlLabel>Machine profile</ControlLabel>
                <MaterialMachineProfile label="Machine profile" onChange={(v) => { onCellChange(operation.id, { machine_profile: v }) }} selected={operation.machine_profile} />
            </FormGroup>
            <FormGroup>
                <ControlLabel>Type</ControlLabel>
                <FormControl componentClass="select" placeholder="type" value={operation.type} onChange={(e) => onCellChange(operation.id, { type: e.target.value })}>
                    {Object.keys(OPERATION_TYPES).map((operationtion, i) => { return <operationtion key={i} value={operationtion}>{operationtion}</operationtion> })}
                </FormControl>
                <FormControl.Feedback />
            </FormGroup>

        </div>;
    } else {
        return <table className="table table-compact">
            <caption>{caption}</caption>
            <tbody>
                <tr><th>Type</th><td>{operation.type}</td></tr>
                <tr><th>Profile</th><td>{operation.machine_profile}</td></tr>
            </tbody>
        </table>;
    }
}

const OMIT_FIELDS_EDITION = ['name', 'filterFillColor', 'filterStrokeColor']

function PresetOperationParameters({ caption, operation, isEditable, onCellChange, children }) {
    let settings = useSelector((state) => state.settings);

    const OP = operation;
    const OPDEF = OPERATION_TYPES[operation.type]
    const fields = {};

    OPDEF.fields.filter((field) => { return !OMIT_FIELDS_EDITION.includes(field) }).forEach((key) => {

        const PARAMDEF = OPERATION_FIELDS[key];
        let FieldType = PARAMDEF.input

        let error = undefined;

        if (PARAMDEF.check && !PARAMDEF.check(OP.params[PARAMDEF.name], settings, OP) && (!PARAMDEF.condition || PARAMDEF.condition(OP, settings))) {
            error = (typeof PARAMDEF.error == 'function') ? PARAMDEF.error(OP.params[PARAMDEF.name], settings, OP) : PARAMDEF.error
        }

        let className = classNames(FieldType.name, { "has-error": (error != null) });

        if (OP.isEditable || isEditable) {
            //writes operation.params[i][key]
            fields[key] = <div className={className} title={error}>
                <FieldType key={PARAMDEF.name} op={OP.params} field={PARAMDEF} style={{}}
                    onChangeValue={(v) => { onCellChange(operation.id, { params: { [key]: v } }) }} />
            </div>
        } else {
            fields[key] = <div className={className} title={error}>{cast(OP.params[PARAMDEF.name], "---")}</div>

        }
    });

    return <div>
        {children}
        <table className="table table-compact">
            {caption ? (<caption>{caption}</caption>) : undefined}
            <tbody>
                {Object.entries(fields).map(([ key, field ], i) => {
                    return <tr key={i}>
                        <th>{OPERATION_FIELDS[key].label}</th>
                        <td>{field}</td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
}

export function Details({ open, className, style, header, handler, children }) {
    // TODO(REFACTOR): Could this be replaced by a native <details> element?
    let [ opened, setOpened ] = useState(open ?? false);

    if (opened === false && open === true) {
        /* Lock open if requested by parent */
        setOpened(true);
    }

    return <div className={classNames("details", className)} style={style}>
        <h5>
            <div className="summary" onClick={() => setOpened((opened) => !opened)}>
                <Icon name={opened ? 'chevron-up' : 'chevron-down'} />&nbsp;{handler}
            </div>
            {header}
        </h5>
        <Collapse in={opened}>
            <div className="content">{children}</div>
        </Collapse>
    </div>;
}

function explainOperation(op) {
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

function MaterialDatabasePicker({ show, onHide, types, onApplyPreset }) {
    let activeProfile = useSelector((state) => state.settings.__selectedProfile ?? "*");
    let groups = useSelector((state) => state.materialDatabase);

    let [ selectedProfile, setSelectedProfile ] = useState(activeProfile);

    return (
        <MaterialModal modal={{ show: show, onHide: onHide }}
            header="Operation Presets">
            <MaterialMachineProfile selected={selectedProfile} onChange={(value) => { setSelectedProfile(value) }} />
            <div className="materialPicker">
                {groups.map((item, i) => {
                    return <section key={i}>
                        <h5>
                            <h4>{item.name}</h4>
                            <small>{item.notes}</small>
                        </h5>

                        {item.presets.map((op, j) => {
                            if (shouldShow(op, selectedProfile)) {
                                let disabled= (types && !types.includes(op.type)) || !types;
                                return <Details key={j}
                                    handler={<div className="handler"><strong>{op.name}</strong><small>{op.type}</small></div>}
                                    header={<Button disabled={disabled} bsStyle="success" bsSize="xsmall" title={disabled? 'Operation Documents not compatible with this type':undefined } onClick={() => { onApplyPreset?.(op.id) }}><Icon name="share" /></Button>}
                                >
                                    <table className="table table-sm">
                                        <tbody>
                                            {explainOperation(op).map((field, k) => {
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
    );
}

export function MaterialDatabaseButton({ children }) {
    let [ showModal, setShowModal ] = useState(false);

    function closeModal(e) {
        if (e) { e.stopPropagation(); }
        setShowModal(false)
    }

    return (
        <Button bsStyle="primary" block onClick={() => setShowModal(true)}>
            {children}
            <MaterialDatabaseEditor show={showModal} onHide={closeModal} />
        </Button>
    )
}

function getMaterialDbGroup(state, id) {
    return state.find((group) => group.id === id);
}

function getMaterialDbPreset(state, id) {
    for (let group of state) {
        for (let preset of group.presets) {
            if (preset.id === id) {
                return preset;
            }
        }
    }

    return null; /* No matches */
}

// TODO(REFACTOR): Why does the callback default to console.log?
function choose(message, options, value, callback = console.log.bind(console)) {
    let optionElements = options
        .map((option) => {
            let selected = (value === option.value) ? 'selected' : '';
            return `<option value="${vex._escapeHtml(option.value)}" ${selected}>${vex._escapeHtml(option.label)}</option>`;
        })
        .join('');

    vex.dialog.open({
        message: message,
        input: [
            `<label>Select <input type="radio" name="opt" value="select"/><select name="select" placeholder="Select">${optionElements}</select></label>`,
            `<label>or Type <input type="radio" name="opt" value="create" checked /><input name="create" type="text" placeholder="${vex._escapeHtml(value)}" value="${vex._escapeHtml(value)}" /></label>`
        ].join(''),
        buttons: [
            { ... vex.dialog.buttons.YES, text: 'Ok' },
            { ... vex.dialog.buttons.NO, text: 'Cancel' }
        ],
        callback: function (result) {
            if (result === false) {
                callback(null);
            } else if (result.opt != null && String(result[result.opt]).trim().length > 0) {
                callback(result[result.opt])
            } else {
                callback(result);
            }
        }
    });
}

const REMOVE_PRESET_KEYS = new Set([ 'id', 'documents' ]);

export function MaterialPickerButton({ className, types, children, onApplyPreset }) {
    let groups = useSelector((state) => state.materialDatabase);
    let [ showModal, setShowModal ] = useState(false);
    
    function handleApplyPreset(operationId) {
        let operation = getMaterialDbPreset(groups, operationId);
        let params = omit(operation.params, (value, key) => value != null && !REMOVE_PRESET_KEYS.has(key));

        onApplyPreset(operation.type, params);
        setShowModal(false);
    }
    
    let closeModal = (e) => {
        if (e) { e.stopPropagation(); }
        setShowModal(false);
    }

    return <>
        <Button title="Load from Material Database" bsStyle="danger" className={className} onClick={() => setShowModal(true)}>
            {children}
        </Button>
        <MaterialDatabasePicker types={types} show={showModal} onHide={closeModal} onApplyPreset={(operationId) => { handleApplyPreset(operationId) }} />
    </>;
}

export function MaterialSaveButton({ className, types, children, operation }) {
    let dispatch = useDispatch();
    let groups = useSelector((state) => state.materialDatabase);
    let [ showModal, setShowModal ] = useState(false);
    
    function handleNewPreset() {
        let options = groups
            .filter((group) => (!group._locked))
            .map((group) => ({ label: group.name, value: group.name }));

        choose("Operation grouping?", options, DEFAULT_GROUPING_NAME, (grouping) => {
            if (grouping != null) {
                prompt("Operation Name? Blank is random", operation.name, (name) => {
                    if (name != null) {
                        dispatch(newPreset(operation, grouping, name));
                    }
                });
            }
        });
    }
    
    let closeModal = (e) => {
        if (e) { e.stopPropagation(); }
        setShowModal(false);
    }

    return <>
        <Button title="Export to Material Database" bsStyle="primary" className={className} onClick={() => handleNewPreset()}>
            {children}
        </Button>
        <MaterialDatabasePicker types={types} show={showModal} onHide={closeModal} />
    </>;
}
