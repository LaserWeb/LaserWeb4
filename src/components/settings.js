import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import stringify from 'json-stringify-pretty-compact';
import { FileStorage, LocalStorage } from '../lib/storages';
import update from 'immutability-helper';
import omit from 'object.omit';
import Validator from 'validatorjs';

import { setSettingsAttrs, uploadSettings, downloadSettings, uploadMachineProfiles, downloadMachineProfiles, uploadSnapshot, downloadSnapshot, storeSnapshot, recoverSnapshot } from '../actions/settings';
import { SETTINGS_VALIDATION_RULES, ValidateSettings } from '../reducers/settings';

import MachineProfile from './machine-profiles';
import { MaterialDatabaseButton } from './material-database';
import { Macros } from './macros'

import { NumberField, TextField, ToggleField, QuadrantField, FileField, CheckBoxListField, SelectField, InputRangeField } from './forms';
import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button } from 'react-bootstrap';
import Icon from './font-awesome';

import { VideoDeviceField, VideoPort, VideoResolutionField } from './webcam';

import { alert, prompt, confirm } from './laserweb';

import { getSubset } from 'redux-localstorage-filter';

import { Details } from './material-database'

export class ApplicationSnapshot extends React.Component {

    constructor(props) {
        super(props);
        this.state = { keys: [] }
        this.handleChange.bind(this)
    }

    getExportData(keys) {
        return getSubset(this.props.state, keys)
    }

    handleChange(data) {
        this.setState({ keys: data })
    }

    render() {
        let data = Object.keys(omit(this.props.state, "history"));
        return (
            <div className="well well-sm " id="ApplicationSnapshot">
                <CheckBoxListField onChange={(data) => this.handleChange(data)} data={data} />
                <section>
                    <table style={{ width: 100 + '%' }}><tbody><tr><td><strong>On File</strong></td>
                        <td><ApplicationSnapshotToolbar loadButton saveButton stateKeys={this.state.keys} saveName="laserweb-snapshot.json" /></td></tr></tbody></table>
                </section>
                <section>
                    <table style={{ width: 100 + '%' }}><tbody><tr><td><strong>On LocalStorage</strong></td>
                        <td><ApplicationSnapshotToolbar recoverButton storeButton stateKeys={this.state.keys} /></td></tr></tbody></table>
                </section>
            </div>
        )
    }

}

export class ApplicationSnapshotToolbar extends React.Component {

    constructor(props) {
        super(props);
        this.handleDownload.bind(this)
        this.handleUpload.bind(this)
        this.handleStore.bind(this)
        this.handleRecover.bind(this)
    }

    getExportData(keys) {
        return getSubset(this.props.state, keys)
    }

    handleDownload(statekeys, saveName, e) {
        prompt('Save as', saveName || "laserweb-snapshot.json", (file) => {
            if (file !== null) {
                statekeys = Array.isArray(statekeys) ? statekeys : (this.props.stateKeys || []);
                this.props.handleDownload(file, this.getExportData(statekeys), downloadSnapshot)
            }
        }, !e.shiftKey)
    }

    handleUpload(file, statekeys) {
        statekeys = Array.isArray(statekeys) ? statekeys : (this.props.stateKeys || []);
        this.props.handleUpload(file, uploadSnapshot, statekeys)
    }

    handleStore(statekeys) {
        statekeys = Array.isArray(statekeys) ? statekeys : (this.props.stateKeys || []);
        this.props.handleStore("laserweb-snapshot", this.getExportData(statekeys), storeSnapshot)
    }

    handleRecover(statekeys) {
        statekeys = Array.isArray(statekeys) ? statekeys : (this.props.stateKeys || []);
        this.props.handleRecover("laserweb-snapshot", uploadSnapshot)
    }

    render() {
        let buttons = [];
        if (this.props.loadButton) {
            buttons.push(<FileField onChange={(e) => this.handleUpload(e.target.files[0], this.props.loadButton)} accept="application/json, .json"><Button bsStyle="danger" bsSize="xs">Load <Icon name="upload" /></Button></FileField>);
        }
        if (this.props.saveButton) {
            buttons.push(<Button onClick={(e) => this.handleDownload(this.props.saveButton, this.props.saveName, e)} className="btn btn-success btn-xs">Save <Icon name="download" /></Button>);
        }
        if (this.props.recoverButton) {
            buttons.push(<Button onClick={(e) => this.handleRecover(this.props.recoverButton)} bsClass="btn btn-danger btn-xs">Load <Icon name="upload" /></Button>);
        }
        if (this.props.storeButton) {
            buttons.push(<Button onClick={(e) => this.handleStore(this.props.storeButton)} bsClass="btn btn-success btn-xs">Save <Icon name="download" /></Button>);
        }

        return <div>
            <div style={{ float: "right", clear: "right" }}>{buttons.map((button, i) => React.cloneElement(button, { key: i }))}{this.props.children}</div>
        </div>
    }
}

class SettingsPanel extends React.Component {

    render() {
        let filterProps = omit(this.props, ['header', 'errors', 'defaultExpanded']);
        let childrenFields = this.props.children.map((item) => { if (item) return item.props.field })
        let hasErrors = Object.keys(this.props.errors || []).filter((error) => { return childrenFields.includes(error) }).length;

        filterProps['defaultExpanded'] = (this.props.defaultExpanded || hasErrors) ? true : false

        let children = this.props.children.map((child, i) => {
            if (!child) return
            let props = { key: i }
            if (child.props.field) props['errors'] = this.props.errors;
            return React.cloneElement(child, props);
        })

        let icon = hasErrors ? <Label bsStyle="warning">Please check!</Label> : undefined;

        return <Panel {...filterProps} header={<span>{icon}{this.props.header}</span>} >{children}</Panel>
    }

}

export function SettingsValidator({ style, className = 'badge', noneOnSuccess = false, ...rest }) {
    let validator = ValidateSettings(false);
    let errors = (validator.fails()) ? ("Please review Settings:\n\n" + Object.values(validator.errors.errors)) : undefined
    if (noneOnSuccess && !errors) return null;
    return <span className={className} title={errors ? errors : "Good to go!"} style={style}><Icon name={errors ? 'warning' : 'check'} /></span>
}

class MachineFeedRanges extends React.Component {

    handleChangeValue(ax, v) {
        let state = this.props.object[this.props.field];
        state = Object.assign(state, { [ax]: Object.assign({ min: Number(this.props.minValue || 0), max: Number(this.props.maxValue || 1e100) }, v || {}) });
        this.props.dispatch(this.props.setAttrs({ [this.props.field]: state }, this.props.object.id))
    }

    render() {
        let axis = this.props.axis || ['X', 'Y'];
        let value = this.props.object[this.props.field];
        return <div className="form-group"><Details handler={<label>Machine feed ranges</label>}>
            <div className="well">{this.props.description ? <small className="help-block">{this.props.description}</small> : undefined}
                <table width="100%" >
                    <tbody>
                        {axis.map((ax, i) => { return <tr key={i}><th width="15%">{ax}</th><td><InputRangeField normalize key={ax} minValue={this.props.minValue || 0} maxValue={this.props.maxValue || 1e100} value={value[ax]} onChangeValue={value => this.handleChangeValue(ax, value)} /></td></tr> })}
                    </tbody>
                </table>
            </div>
        </Details>
        </div>
    }
}
MachineFeedRanges = connect()(MachineFeedRanges)

class Settings extends React.Component {

    constructor(props) {
        super(props);
        this.state = { errors: null }
    }

    validate(data, rules) {
        let check = new Validator(data, rules);

        if (check.fails()) {
            console.error("Settings Error:" + JSON.stringify(check.errors.errors));
            return check.errors.errors;
        }
        return null;
    }

    rules() {
        return SETTINGS_VALIDATION_RULES;
    }

    componentWillMount() {
        this.setState({ errors: this.validate(this.props.settings, this.rules()) })
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ errors: this.validate(nextProps.settings, this.rules()) })
    }



    render() {



        let isVideoDeviceSelected = Boolean(this.props.settings['toolVideoDevice'] && this.props.settings['toolVideoDevice'].length);


        return (
            <div className="form">

                <PanelGroup>
                    <Panel header="Machine Profiles" bsStyle="primary" collapsible defaultExpanded={true} eventKey="0">
                        <MachineProfile onApply={this.props.handleApplyProfile} />
                        <MaterialDatabaseButton>Launch Material Database</MaterialDatabaseButton>
                    </Panel>
                    <SettingsPanel collapsible header="Machine" eventKey="1" bsStyle="info" errors={this.state.errors} >
                        <NumberField {...{ object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Machine Width', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Machine Height', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineBeamDiameter', setAttrs: setSettingsAttrs, description: (<span>Beam <abbr title="Diameter">&Oslash;</abbr></span>), units: 'mm' }} />
                        <hr />
                        <MachineFeedRanges minValue={1} maxValue={Infinity} axis={['XY', 'Z', 'A', 'S']} object={this.props.settings} field={'machineFeedRange'} setAttrs={setSettingsAttrs} description="Stablishes the feed range warning threshold for an axis." />
                        <hr />
                        <NumberField {...{ object: this.props.settings, field: 'machineOriginX', setAttrs: setSettingsAttrs, description: 'Machine Origin X', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineOriginY', setAttrs: setSettingsAttrs, description: 'Machine Origin Y', units: 'mm' }} />

                        <hr />
                        <ToggleField {... { object: this.props.settings, field: 'machineZEnabled', setAttrs: setSettingsAttrs, description: 'Machine Z stage' }} />
                        <Collapse in={this.props.settings.machineZEnabled}>
                            <div>
                                <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZToolOffset', setAttrs: setSettingsAttrs, description: 'Tool offset', labelAddon: false, units: 'mm' }} />
                                <TextField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZStartHeight', setAttrs: setSettingsAttrs, description: 'Default Start Height', labelAddon: false, units: 'mm' }} />
                            </div>
                        </Collapse>
                        <hr />
                        <ToggleField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineBlowerEnabled', setAttrs: setSettingsAttrs, description: 'Air Assist' }} />
                        <Collapse in={this.props.settings.machineBlowerEnabled}>
                            <div>
                                <TextField {...{ object: this.props.settings, field: 'machineBlowerGcodeOn', setAttrs: setSettingsAttrs, description: 'Gcode AA ON', rows: 5, style: { resize: "vertical" } }} />
                                <TextField {...{ object: this.props.settings, field: 'machineBlowerGcodeOff', setAttrs: setSettingsAttrs, description: 'Gcode AA OFF', rows: 5, style: { resize: "vertical" } }} />
                            </div>
                        </Collapse>
                    </SettingsPanel>
                    <SettingsPanel collapsible header="File Settings" eventKey="2" bsStyle="info" errors={this.state.errors}>
                        <h4>SVG</h4>
                        <NumberField {...{ object: this.props.settings, field: 'pxPerInch', setAttrs: setSettingsAttrs, description: 'PX Per Inch', units: 'pxpi' }} />
                        <h4>BITMAPS (bmp, png, jpg)</h4>
                        <NumberField {...{ object: this.props.settings, field: 'dpiBitmap', setAttrs: setSettingsAttrs, description: 'Bitmap DPI', units: 'dpi' }} />
                    </SettingsPanel>
                    <SettingsPanel collapsible header="Gcode" eventKey="3" bsStyle="info" errors={this.state.errors}>
                        <h4>Gcode generation</h4>
                        <TextField {...{ object: this.props.settings, field: 'gcodeStart', setAttrs: setSettingsAttrs, description: 'Gcode Start', rows: 5, style: { resize: "vertical" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeEnd', setAttrs: setSettingsAttrs, description: 'Gcode End', rows: 5, style: { resize: "vertical" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeHoming', setAttrs: setSettingsAttrs, description: 'Gcode Homing', rows: 5, style: { resize: "vertical" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeToolOn', setAttrs: setSettingsAttrs, description: 'Tool ON', rows: 5, style: { resize: "vertical" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeToolOff', setAttrs: setSettingsAttrs, description: 'Tool OFF', rows: 5, style: { resize: "vertical" } }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeSMaxValue', setAttrs: setSettingsAttrs, description: 'PWM Max S value' }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeCheckSizePower', setAttrs: setSettingsAttrs, description: 'Check-Size Power', units: '%' }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeToolTestPower', setAttrs: setSettingsAttrs, description: 'Tool Test Power', units: '%' }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeToolTestDuration', setAttrs: setSettingsAttrs, description: 'Tool Test duration', units: 'ms' }} />
                    </SettingsPanel>
                    <SettingsPanel collapsible header="Application" eventKey="4" bsStyle="info" errors={this.state.errors}>
                        <SelectField {...{ object: this.props.settings, field: 'toolFeedUnits', setAttrs: setSettingsAttrs, data: ['mm/s', 'mm/min'], defaultValue: 'mm/min', description: 'Feed Units', selectProps: { clearable: false } }} />
                        <ToggleField {... { object: this.props.settings, field: 'toolSafetyLockDisabled', setAttrs: setSettingsAttrs, description: 'Disable Safety Lock' }} />
                        <ToggleField {... { object: this.props.settings, field: 'toolCncMode', setAttrs: setSettingsAttrs, description: 'Enable CNC Mode' }} />
                        <ToggleField {... { object: this.props.settings, field: 'toolUseNumpad', setAttrs: setSettingsAttrs, description: 'Use Numpad' }} />
                        <QuadrantField {... { object: this.props.settings, field: 'toolImagePosition', setAttrs: setSettingsAttrs, description: 'Raster Image Position' }} />
                    </SettingsPanel>

                    <Panel collapsible header="Camera" bsStyle="info" eventKey="6">
                        <table width="100%"><tbody><tr>
                            <td width="45%"><VideoDeviceField {...{ object: this.props.settings, field: 'toolVideoDevice', setAttrs: setSettingsAttrs, description: 'Video Device' }} /></td>
                            <td width="45%"><VideoResolutionField {...{ object: this.props.settings, field: 'toolVideoResolution', setAttrs: setSettingsAttrs, deviceId: this.props.settings['toolVideoDevice'] }} /></td>

                        </tr></tbody></table>

                        <VideoPort height={240} enabled={this.props.settings['toolVideoDevice'] !== null} />

                        <TextField   {... { object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url' }} />
                    </Panel>

                    <Panel collapsible header="Macros" bsStyle="info" eventKey="7">
                        <Macros />
                    </Panel>

                    <Panel collapsible header="Tools" bsStyle="danger" eventKey="8" >
                        <table style={{ width: 100 + '%' }}><tbody>
                            <tr><td><strong>Settings</strong></td>
                                <td><ApplicationSnapshotToolbar loadButton saveButton stateKeys={['settings']} label="Settings" saveName="laserweb-settings.json" /><hr /></td></tr>
                            <tr><td><strong>Machine Profiles</strong></td>
                                <td><ApplicationSnapshotToolbar loadButton saveButton stateKeys={['machineProfiles']} label="Machine Profiles" saveName="laserweb-profiles.json" /><hr /></td></tr>
                            <tr><td><strong>Macros</strong></td>
                                <td><Button bsSize="xsmall" onClick={e => this.props.handleResetMacros()} bsStyle="warning">Reset</Button></td></tr>
                        </tbody></table>

                        <h5 >Application Snapshot  <Label bsStyle="warning">Caution!</Label></h5>


                        <small className="help-block">This dialog allows to save an entire snapshot of the current state of application.</small>
                        <ApplicationSnapshot />
                    </Panel>
                </PanelGroup>
            </div>
        );


    }
}

const mapStateToProps = (state) => {

    return {
        settings: state.settings,
        profiles: state.machineProfiles
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        handleResetMacros: () => {
            confirm("Are you sure?", (data) => { if (data !== null) dispatch({ type: "MACROS_RESET" }) })

        },
        handleSettingChange: (attrs) => {
            dispatch(setSettingsAttrs(attrs, 'settings'))
        },
        handleDownload: (file, settings, action) => {
            FileStorage.save(file, stringify(settings), "application/json")
            dispatch(action(settings));
        },
        handleUpload: (file, action, onlyKeys) => {
            FileStorage.load(file, (file, result) => {
                dispatch(action(file, result, onlyKeys));
            })
        },

        handleStore: (name, settings, action) => {
            try {
                LocalStorage.save(name, stringify(settings), "application/json")
            } catch (e) {
                console.error(e);
                alert(e)
            }
            dispatch(action(settings));
        },
        handleRecover: (name, action) => {
            LocalStorage.load(name, (file, result) => dispatch(action(file, result)));
        },
        handleApplyProfile: (settings) => {
            dispatch(setSettingsAttrs(settings));
        }

    };
};

export { Settings }

ApplicationSnapshot = connect((state) => {
    return { state: state }
}, mapDispatchToProps)(ApplicationSnapshot);

ApplicationSnapshotToolbar = connect((state) => {
    return { state: state }
}, mapDispatchToProps)(ApplicationSnapshotToolbar);

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
