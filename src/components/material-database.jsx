import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';

import { Modal, Button, ButtonToolbar, FormControl, ControlLabel, FormGroup, PanelGroup, Collapse, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import Icon from './font-awesome';
import Splitter from './splitter';
import { FileField } from './forms';
import { AllowCapture } from './capture'

import stringify from 'json-stringify-pretty-compact';
import Validator from 'validatorjs';
import omit from 'object.omit';
import vex from '../lib/vex';

import {
    addGroup, setGroupAttrs, deleteGroup, toggleGroupView, toggleGroupEdit,
    addPreset, deletePreset, setPresetAttrs, togglePresetEdit,
    uploadMaterialDatabase, downloadMaterialDatabase,
    applyPreset, newPreset
} from '../actions/material-database.js';

import { OPERATION_FIELDS, OPERATION_TYPES } from './operation';
import { DEFAULT_GROUPING_NAME } from '../reducers/material-database';
import { GlobalStore } from '../index';
import { FileStorage, LocalStorage } from '../lib/storages';
import { cast } from '../lib/helpers';
import { materialTreeToTabular, materialTabularToTree, arr2csv, csv2arr } from '../lib/material-database';
import { alert, prompt, confirm } from './laserweb';

import '../styles/material-database.css';

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

function selectGroupFromMaterialDatabase(state, id) {
    return state.find((group) => group.id === id);
}

function selectPresetFromMaterialDatabase(state, id) {
    for (let group of state) {
        for (let preset of group.presets) {
            if (preset.id === id) {
                return preset;
            }
        }
    }

    return null; /* No matches */
}

let selectProfileFilter = (state) => state.settings.__selectedProfile ?? "*"; // NOTE: Comma-separated list or * for 'everything'
let selectGroups = (state) => state.materialDatabase;
let selectGroup = (groupID) => (state) => selectGroupFromMaterialDatabase(state.materialDatabase, groupID);

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

// FIXME(REFACTOR): Probably turn this into a selector (from materialDatabase?) instead
function matchOperationAgainstProfileFilter(operation, filter) {
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
    let groups = useSelector(selectGroups);
    let profileFilter = useSelector(selectProfileFilter);

    let [ groupID, setGroupID ] = useState(null);
    let [ selectedProfileFilter, setSelectedProfileFilter ] = useState(profileFilter);

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

    return (
        <MaterialModal modal={{ show: show, onHide: onHide }} className='full-width' header="Material Database" footer={footer}>
            <MaterialMachineProfile profiles={profiles} selected={selectedProfileFilter} onChange={(value) => setSelectedProfileFilter(value)} />

            <AllowCapture className="paneSizer" >
                <div className="paneContainer materialsDatabase">
                    <Splitter split="vertical" initialSize={300} splitterId="groupsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }}>
                        <Pane id="groupsPane"><PaneContentGroups groupID={groupID} onMaterialSelected={(id) => setGroupID(id)}/></Pane>
                    </Splitter>
                    <Splitter split="vertical" initialSize={300} splitterId="operationsPane" resizerStyle={{ marginLeft: 2, marginRight: 2 }}>
                        <Pane className="left"><PaneContentGroupDetails groupID={groupID} /></Pane>
                    </Splitter>
                    <Pane className="right"><PaneContentGroupPresets groupID={groupID} profileFilter={selectedProfileFilter} /></Pane>
                </div>
            </AllowCapture>
        </MaterialModal>
    )
}

function Pane({ id, className, style, children }) {
    /* NOTE: `style` must be passed through for Splitter to work; it injects props */
    return <div id={id} className={classNames("innerPane", className)} style={style}>
        {children}
    </div>;
}

function PaneToolbar({ caption, children }) {
    return <div className="paneToolbar">
        <div className="caption">{caption != null ? <h5>{caption}</h5> : null}</div>
        <div className="controls">{children}</div>
    </div>;
}

function IconButton({ type, size, icon, caption, onClick, ... rest }) {
    return <Button onClick={onClick} bsSize={size ?? "xs"} bsStyle={type} {... rest}>
        <Icon name={icon} />
        {(caption != null) ? ` ${caption}` : null}
    </Button>;
}

function PaneContentGroups({ groupID, onMaterialSelected }) {
    let dispatch = useDispatch();
    let groups = useSelector(selectGroups);

    function confirmDeleteGroup(id) {
        // FIXME(REFACTOR): Unclear error message
        confirm("Are you sure?", (accepted) => {
            if (accepted) {
                dispatch(deleteGroup(id));
                onMaterialSelected(null);
            }
        });
    }

    return <>
        <PaneToolbar caption="Groupings">
            <IconButton type="success" icon="plus" caption="Add" onClick={() => dispatch(addGroup())} />
            <IconButton type="danger" icon="trash" caption="Delete" onClick={() => confirmDeleteGroup(groupID)} disabled={groupID == null} />
        </PaneToolbar>
        <div className="listing">
            {groups.map((item, i) => {
                // FIXME(REFACTOR): It looks like item._locked is repurposed to also indicate an included preset (giftbox icon) by setting it to `false`? That should really be a separate field for clarity.
                let header = (item._locked)
                    ? <h5 title="This grouping is locked. Will be reset on next application start.">{item.name} <Icon name="lock" /></h5>
                    : <h5>{item.name} {(item._locked===false ? <Icon name="gift" /> : null)}</h5>;

                // FIXME(REFACTOR): 'active' style is currently broken and not visible, need to fix that
                return <div id={item.id} key={i} onClick={() => onMaterialSelected(item.id)} className={(groupID == item.id) ? 'active' : undefined}>
                    {header}
                    <small>{item.notes}</small>
                </div>
            })}
        </div>
    </>;
}

function PaneContentGroupDetails({ groupID }) {
    let dispatch = useDispatch();
    let groups = useSelector(selectGroups);
    let group = useSelector(selectGroup(groupID));

    let onGroupEdit = (id) => dispatch(toggleGroupEdit(id));
    let onGroupChange = (id, attrs) => dispatch(setGroupAttrs(id, attrs));

    function cloneGroupTemplate(fromId, toId) {
        let source = selectGroupFromMaterialDatabase(groups, fromId);

        if (source != null) {
            dispatch(setGroupAttrs(toId, { template: source.template }));
        }
    }
    
    if (group != null) {
        let heading;

        if (group.isEditable) {
            heading = (<div className="operationHeading isEditable">
                <fieldset>
                    <legend>Grouping</legend>
                    <FormGroup>
                        <ControlLabel>Name</ControlLabel>
                        <FormControl
                            type="text"
                            value={group.name}
                            placeholder="Name of the Operation Group"
                            onChange={(e) => { onGroupChange(groupID, { name: e.target.value }) }}
                        />
                        <FormControl.Feedback />
                    </FormGroup>

                    <FormGroup>
                        <ControlLabel>Notes</ControlLabel>
                        <FormControl componentClass="textarea" placeholder="notes" value={group.notes} onChange={(e) => { onGroupChange(groupID, { notes: e.target.value }) }} />
                        <FormControl.Feedback />
                    </FormGroup>
                </fieldset>
                <fieldset>
                    <legend>Default Template</legend>

                    <PresetOperationSettings operation={group.template} caption="Settings" isEditable={true}
                        onCellChange={(id, attrs) => { onGroupChange(groupID, { template: attrs }) }} />

                    <PresetOperationParameters operation={group.template} caption="Parameters" isEditable={true}
                        onCellChange={(id, attrs) => { onGroupChange(groupID, { template: attrs }) }} />

                </fieldset>
            </div>)
        } else {
            heading = (<div className="operationHeading">
                <h3>{group.name}</h3>{group.notes ? (<p>{group.notes}</p>) : undefined}

                <PresetOperationSettings operation={group.template} caption="Settings" />
                <PresetOperationParameters operation={group.template} caption="Parameters" />
            </div>)
        }

        return <>
            <PaneToolbar caption="Group">
                {group.isEditable
                    ? <IconButton type="primary" icon="floppy-o" caption="Save" onClick={() => onGroupEdit(groupID)} />
                    : <IconButton type="warning" icon="pencil" caption="Edit" onClick={() => onGroupEdit(groupID)} />}
            </PaneToolbar>
            {heading}
            <PresetActions groupId={groupID} disabled={group.isEditable} onCloneTo={(from, to) => cloneGroupTemplate(groupID, to)} />
        </>;
    }
}

function PaneContentGroupPresets({ profileFilter, groupID }) {
    let dispatch = useDispatch();
    let group = useSelector(selectGroup(groupID));

    function confirmDeletePreset(id) {
        // FIXME(REFACTOR): Unclear error message
        confirm("Are you sure?", (accepted) => {
            if (accepted) {
                dispatch(deletePreset(id));
            }
        });
    }

    let onPresetChange = (id, attrs) => dispatch(setPresetAttrs(id, attrs));
    let onPresetEdit = (id) => dispatch(togglePresetEdit(id));

    if (group == null) {
        // FIXME(REFACTOR): Unclear error message, and logic doesn't seem correct either? Message always seems to show when no group is selected
        // Is it even possible for profileFilter length to be 0, now that it defaults to *?
        return <PanelGroup defaultActiveKey="0">
            { profileFilter.length > 0 ? 'Presets not shown due machine profile filters' : null }
        </PanelGroup>;
    } else {
        let presets = group.presets.filter((operation) => matchOperationAgainstProfileFilter(operation, profileFilter));

        return <>
            <PaneToolbar caption="Presets">
                <IconButton type="success" icon="plus" caption="Add" onClick={() => dispatch(addPreset(groupID))} />
            </PaneToolbar>
            <PanelGroup defaultActiveKey="0">
                {presets.map((operation, i) => {
                    return <Details className={operation.isEditable ? "editable" : ""} key={i} open={operation.isEditable}
                        handler={<h4>{`${operation.name} (${operation.type})`} <div><small>{operation.notes}</small></div></h4>}
                        header={<div>
                            {operation.isEditable
                                ? <IconButton type="primary" icon="floppy-o" caption="Save" onClick={() => onPresetEdit(operation.id)} />
                                : <IconButton type="warning" icon="pencil" caption="Edit" onClick={() => onPresetEdit(operation.id)} />}

                            <Button onClick={() => { confirmDeletePreset(operation.id) }} bsSize="xsmall" bsStyle="danger"><Icon name="trash" /> Delete</Button>
                        </div>} >
                        <PresetOperationSettings operation={operation} isEditable={operation.isEditable}
                            onCellChange={(id, attrs) => { onPresetChange(id, attrs) }}
                            caption="Settings" />

                        <PresetOperationParameters operation={operation} isEditable={operation.isEditable}
                            onCellChange={(id, attrs) => { onPresetChange(id, attrs) }}
                            caption="Parameters" />
                    </Details>
                })}
                { (!presets.length && profileFilter.length) ? 'Presets not shown due machine profile filters':undefined }
            </PanelGroup>
        </>;
    }
}

function PresetActions({ disabled, groupId, onCloneTo }) {
    let groups = useSelector(selectGroups);
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
                    {Object.keys(OPERATION_TYPES).map((operation, i) => { return <operation key={i} value={operation}>{operation}</operation> })}
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
    let profileFilter = useSelector(selectProfileFilter);
    let groups = useSelector(selectGroups);

    let [ selectedProfileFilter, setSelectedProfileFilter ] = useState(profileFilter);

    return (
        <MaterialModal modal={{ show: show, onHide: onHide }}
            header="Operation Presets">
            <MaterialMachineProfile selected={selectedProfileFilter} onChange={(value) => { setSelectedProfileFilter(value) }} />
            <div className="materialPicker">
                {groups.map((item, i) => {
                    return <section key={i}>
                        <h5>
                            <h4>{item.name}</h4>
                            <small>{item.notes}</small>
                        </h5>

                        {item.presets.map((op, j) => {
                            if (matchOperationAgainstProfileFilter(op, selectedProfileFilter)) {
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
    let groups = useSelector(selectGroups);
    let [ showModal, setShowModal ] = useState(false);
    
    function handleApplyPreset(operationId) {
        let operation = selectPresetFromMaterialDatabase(groups, operationId);
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
    let groups = useSelector(selectGroups);
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
