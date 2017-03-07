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

import { NumberField, TextField, ToggleField, QuadrantField, FileField, CheckBoxListField, SelectField } from './forms';
import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button } from 'react-bootstrap';
import Icon from './font-awesome';

import { PerspectiveWebcam, VideoDeviceField, VideoControls, VideoResolutionField } from './webcam';

import { alert, prompt, confirm} from './laserweb';

export class ApplicationSnapshot extends React.Component {

    constructor(props) {
        super(props);
        this.state = { keys: [] }
        this.handleChange.bind(this)
    }

    getExportData(keys) {
        let state = this.props.state;
        let exp = {}
        keys.forEach((o) => { exp[o] = state[o] })
        return exp;
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
                    <ApplicationSnapshotToolbar loadButton saveButton stateKeys={this.state.keys} label="On File" saveAs="laserweb-snapshot.json" />
                </section>
                <section>
                    <ApplicationSnapshotToolbar recoverButton storeButton stateKeys={this.state.keys} label="On LocalStorage" />
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
        let state = this.props.state;
        let exp = {}
        keys.forEach((o) => { exp[o] = state[o] })
        return exp;
    }

    handleDownload(statekeys) {
        statekeys = Array.isArray(statekeys) ? statekeys : (this.props.stateKeys || []);
        prompt("Save as", this.props.saveAs || "laserweb-snapshot.json", (file)=>{
            if (!file) return;
            let settings = this.getExportData(statekeys);
            let action = downloadSnapshot;
            this.props.handleDownload(file, settings, action)
        })
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
            buttons.push(<FileField dispatch={(e) => this.handleUpload(e.target.files[0], this.props.loadButton)} label="Load" buttonClass="btn btn-danger btn-xs" icon="upload" />);
        }
        if (this.props.saveButton) {
            buttons.push(<Button onClick={() => this.handleDownload(this.props.saveButton)} className="btn btn-success btn-xs">Save <Icon name="download" /></Button>);
        }
        if (this.props.recoverButton) {
            buttons.push(<Button onClick={(e) => this.handleRecover(this.props.recoverButton)} bsClass="btn btn-danger btn-xs">Load <Icon name="upload" /></Button>);
        }
        if (this.props.storeButton) {
            buttons.push(<Button onClick={(e) => this.handleStore(this.props.storeButton)} bsClass="btn btn-success btn-xs">Save <Icon name="download" /></Button>);
        }

        return <div className={this.props.className}><strong>{this.props.label || "Snapshot"}</strong>
            <ButtonGroup style={{ float: "right", clear: "right" }}>{buttons.map((button, i) => React.cloneElement(button, { key: i }))}</ButtonGroup>
            <br style={{ clear: 'both' }} />
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

export function SettingsValidator({style, className = 'badge', noneOnSuccess = false, ...rest}) {
    let validator = ValidateSettings(false);
    let errors = (validator.fails()) ? ("Please review Settings:\n\n" + Object.values(validator.errors.errors)) : undefined
    if (noneOnSuccess && !errors) return null;
    return <span className={className} title={errors ? errors : "Good to go!"} style={style}><Icon name={errors ? 'warning' : 'check'} /></span>
}

class Settings extends React.Component {

    constructor(props) {
        super(props);
        this.state = { errors: null, showVideoControls: false }
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

        const showVideoControls = (e) => {
            this.setState({ showVideoControls: !this.state.showVideoControls })
        }

        let isVideoDeviceSelected = Boolean(this.props.settings['toolVideoDevice'] && this.props.settings['toolVideoDevice'].length);

        let button = null;
        if (window.require) {
          button = <Button bsSize="xs" bsStyle="warning" onClick={(e)=>{this.props.handleDevTools(e)}}><Icon name="gear"/> Toggle Dev tools</Button>
        } else {
          button = null
        }

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
                            <td width="10%" style={{ verticalAlign: 'bottom' }}><FormGroup><Button onClick={showVideoControls} bsStyle="primary" active={this.state.showVideoControls} disabled={!(this.props.settings['toolVideoDevice'] && this.props.settings['toolVideoDevice'].length)} ><Icon name="gears" /></Button></FormGroup></td>
                        </tr></tbody></table>


                        {isVideoDeviceSelected ? <PerspectiveWebcam
                            showCoordinators={this.state.showVideoControls}
                            width="640" height="480"
                            device={this.props.settings['toolVideoDevice']}
                            perspective={this.props.settings['toolVideoPerspective']}
                            lens={this.props.settings['toolVideoLens']}
                            fov={this.props.settings['toolVideoFov']}
                            resolution={this.props.settings['toolVideoResolution']}
                            onStop={(perspective) => { this.props.handleSettingChange({ toolVideoPerspective: perspective }) }} /> : undefined}

                        <Collapse in={this.state.showVideoControls && isVideoDeviceSelected}><div><VideoControls
                            lens={this.props.settings['toolVideoLens']}
                            fov={this.props.settings['toolVideoFov']}
                            videoWidth="640" videoHeight="480"
                            perspective={this.props.settings['toolVideoPerspective']}
                            resolution={this.props.settings['toolVideoResolution']}
                            onChange={(v) => this.props.handleSettingChange({ toolVideoLens: v.lens, toolVideoFov: v.fov, toolVideoPerspective: v.perspective })} /></div></Collapse>

                        <TextField   {... { object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url' }} />
                    </Panel>

                    <Panel collapsible header="Macros" bsStyle="info" eventKey="7">
                        <Macros />
                    </Panel>

                    <Panel collapsible header="Tools" bsStyle="danger" eventKey="8" >
                        <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['settings']} label="Settings" saveAs="laserweb-settings.json" /><hr />
                        <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['machineProfiles']} label="Machine Profiles" saveAs="laserweb-profiles.json" /><hr />
                        <h5 >Application Snapshot  <Label bsStyle="warning">Experimental!</Label></h5>
                        <small className="help-block">This dialog allows to save an entire snapshot of the current state of application.</small>
                        <ApplicationSnapshot />
                        <ButtonToolbar>
                        {button}
                        <Button bsSize="xs" bsStyle="warning" onClick={(e)=>{this.props.handleRefresh(e)}}><Icon name="refresh"/> Refresh window</Button>
                        </ButtonToolbar>
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
        },
        handleDevTools:() => {
            if (window.require) { // Are we in Electron?
              const electron = window.require('electron');
              const app = electron.remote;
              var focusedWindow = app.BrowserWindow.getFocusedWindow()
              // focusedWindow.openDevTools();
              if (app.BrowserWindow.getFocusedWindow){
                  // var focusedWindow = app.BrowserWindow.getFocusedWindow()
                  if (focusedWindow.isDevToolsOpened()) {
                      focusedWindow.closeDevTools();
                  } else {
                      focusedWindow.openDevTools();
                  }
              }
            } else {
                console.warn("Can't do that, pal")
            }
        },
        handleRefresh:() => {

            confirm("Are you sure? This will destroy unsaved work", (b)=>{ if (b) location.reload();})

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
