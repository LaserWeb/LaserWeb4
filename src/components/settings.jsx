import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import stringify from 'json-stringify-pretty-compact';
import { FileStorage, LocalStorage } from '../lib/storages';
import omit from 'object.omit';
import Validator from 'validatorjs';

import { setSettingsAttrs, uploadSettings, downloadSettings, uploadMachineProfiles, downloadMachineProfiles, uploadSnapshot, downloadSnapshot, storeSnapshot, recoverSnapshot } from '../actions/settings';
import { SETTINGS_VALIDATION_RULES, ValidateSettings } from '../reducers/settings';

import MachineProfile from './machine-profiles';
import { MaterialDatabaseButton } from './material-database';
import { Macros } from './macros'

import { NumberField, TextField, ToggleField, QuadrantField, FileField, CheckBoxListField, SelectField, InputRangeField, ColorPicker, Info } from './forms';
import { PanelGroup, Panel, Tooltip, OverlayTrigger, FormControl, InputGroup, ControlLabel, FormGroup, ButtonGroup, Label, Collapse, Badge, ButtonToolbar, Button } from 'react-bootstrap';
import Icon from './font-awesome';

import { VideoDeviceField, VideoPort, VideoResolutionField, ArucoMarker } from './webcam';

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

    UNSAFE_componentWillMount() {
        this.setState({ errors: this.validate(this.props.settings, this.rules()) })
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({ errors: this.validate(nextProps.settings, this.rules()) })
    }



    render() {



        let isVideoDeviceSelected = Boolean(this.props.settings['toolVideoDevice'] && this.props.settings['toolVideoDevice'].length);
        let settingsFileName = "laserweb-settings.json";
        if (this.props.settings['__selectedProfile']) {
            settingsFileName = "laserweb-settings-" + this.props.settings['__selectedProfile'].replace('*','default_')  + ".json";
        }

        return (
            <div className="form">
                <PanelGroup>
                    <Panel header="Machine Profiles" bsStyle="primary" collapsible defaultExpanded={true} eventKey="0">
                        <MachineProfile onApply={this.props.handleApplyProfile} />
                        <MaterialDatabaseButton>Launch Material Database</MaterialDatabaseButton>
                    </Panel>

                    <SettingsPanel collapsible header="Machine" eventKey="1" bsStyle="info" errors={this.state.errors} >
                        <h5 className="header">Machine Dimensions</h5>
                        <NumberField {...{ object: this.props.settings, field: 'machineWidth', setAttrs: setSettingsAttrs, description: 'Width', units: 'mm', info: Info(<p className="help-block">
                                    The total width and height (X and Y) size of the machine work area
                                    </p>,"Working Dimensions") }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineHeight', setAttrs: setSettingsAttrs, description: 'Height', units: 'mm' }} />

                        <h5 className="header">Machine Origin offsets</h5>
                        <NumberField {...{ object: this.props.settings, field: 'machineBottomLeftX', setAttrs: setSettingsAttrs, description: 'Left X', units: 'mm', info: Info(<p className="help-block">
                                    X and Y offsets for the machine work area relative to the Home position.<br/>For a machine that homes to the top-right corner use negative values.
                                    </p>,"Working Area Offset") }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineBottomLeftY', setAttrs: setSettingsAttrs, description: 'Bottom Y', units: 'mm' }} />
                        <h5 className="header">Tool head</h5>
                        <NumberField {...{ object: this.props.settings, field: 'machineBeamDiameter', setAttrs: setSettingsAttrs, description: (<span>Beam <abbr title="Diameter">&Oslash;</abbr></span>), info: Info(<p className="help-block">
                                    The diameter of the laser spot when cutting and marking.<br/>Used for the suggested width in laser cut, fill and raster operations.
                                    </p>,"Laser beam diameter"), units: 'mm' }} />
                        <ToggleField {...{ object: this.props.settings, field: 'machineBurnWhite', setAttrs: setSettingsAttrs, description: 'Burn White', info: Info(<p className="help-block">
                                    Do not use 'G0' rapid movement for white (blank) areas when rastering, use 'G1 S0' instead.<br/>This can improve quality for high speed rastering using powerful lasers.
                                    </p>,"Reduce laser on/off cycling") }} />
                        <ToggleField {...{ object: this.props.settings, field: 'machineLaserHasIntensity', setAttrs: setSettingsAttrs, description: 'Laser Intensity', info: Info(<p className="help-block">
                                    If your machine does not support variable laser intensity (pwm), you can disable this option.<br/>This will prevent any intensity flags from being output, eg "G1" instead of "G1 S1"<br/> This can prevent jitter for some machines.
                                    </p>,"Variable laser intensity") }} />
                        <h5 className="header">Probe Tool Offsets</h5>
                        <NumberField {...{ object: this.props.settings, field: 'machineXYProbeOffset', setAttrs: setSettingsAttrs, description: 'X/Y Offset', units: 'mm' , info: Info(<p className="help-block">
                                    The XY offset from the probe center to the probe contact surface.<br/>Typically set to the radius of your probing tool.
                                    </p>,"Probe Offsets") }} />
                        <NumberField {...{ object: this.props.settings, field: 'machineZProbeOffset', setAttrs: setSettingsAttrs, description: 'Z Offset', units: 'mm' , info: Info(<p className="help-block">
                                    Vertical offset for the probing tool.<br/>Leave as '0' if you probe using the tool itself.
                                    </p>,"Probe Offsets") }} />
                        <hr />
                        <MachineFeedRanges minValue={1} maxValue={Infinity} axis={['XY', 'Z', 'A', 'S']} object={this.props.settings} field={'machineFeedRange'} setAttrs={setSettingsAttrs} description="Define maximum and minimum thresholds for movement speeds and tool power." />
                        <hr />
                        <ToggleField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineBlowerEnabled', setAttrs: setSettingsAttrs, description: 'Laser Cutting Air Assist', info: Info(<p className="help-block">
                                    Gcode commands to start and stop air assistance during laser cutting operations.
                                    </p>,"Air Assist Gcode") }} />
                        <Collapse in={this.props.settings.machineBlowerEnabled}>
                            <div>
                                <TextField {...{ object: this.props.settings, field: 'machineBlowerGcodeOn', setAttrs: setSettingsAttrs, description: 'AirAssist ON Gcode ', rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                                <TextField {...{ object: this.props.settings, field: 'machineBlowerGcodeOff', setAttrs: setSettingsAttrs, description: 'AirAssist OFF Gcode', rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                            </div>
                        </Collapse>
                        <hr />
                        <ToggleField {... { object: this.props.settings, field: 'machineZEnabled', setAttrs: setSettingsAttrs, description: 'Z Stage Support', info: Info(<p className="help-block">
                                    Full 3-Axis support.<br/>Use for lasers with a Z axis, milling and engraving machines.
                                    </p>,"Z-axis") }} />
                        <Collapse in={this.props.settings.machineZEnabled}>
                            <div>
                                <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZToolOffset', setAttrs: setSettingsAttrs, description: 'Tool Z Offset', info: Info(<p className="help-block">
                                    Vertical offset for tool, if required.
                                    </p>,"Tool Z offset"), labelAddon: false, units: 'mm' }} />
                                <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineZStartHeight', setAttrs: setSettingsAttrs, description: 'Default Start Height', info: Info(<p className="help-block">
                                    Thi is the default Z start value for all operation types.
                                    </p>,"Default Z height"), labelAddon: false, units: 'mm' }} />
                                <ToggleField {... { object: this.props.settings, field: 'machineMillEnabled', setAttrs: setSettingsAttrs, description: 'Engraving and Mill Features', info: Info(<p className="help-block">
                                            Enables support for generating Mill and Engraving paths from vectors, including pocketing and v-carve operations.<br/>
                                            Also enables lathe operation generation.
                                            </p>,"Spindle Support") }} />
                                <Collapse in={this.props.settings.machineMillEnabled}>
                                    <div>
                                      <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineRapidZ', setAttrs: setSettingsAttrs, description: 'Mill Rapid Travel Z Height', info: Info(<p className="help-block">
                                          Defines the default vertical clearance given to the workpiece when rapidly traversing between individual mill cuts.
                                          </p>,"Mill and Lathe rapid movement Z height"), labelAddon: false, units: 'mm' }} />
                                      <ToggleField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineFluidEnabled', setAttrs: setSettingsAttrs, description: 'Mill Fluid Assist', info: Info(<p className="help-block">
                                                    Gcode commands to start and stop tool lubrication or cooling flow during milling or lathe operations.
                                                    </p>,"Lubrication and Cooling Gcode") }} />
                                        <Collapse in={this.props.settings.machineFluidEnabled}>
                                            <div>
                                                <TextField {...{ object: this.props.settings, field: 'machineFluidGcodeOn', setAttrs: setSettingsAttrs, description: 'Fluid ON Gcode', rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                                                <TextField {...{ object: this.props.settings, field: 'machineFluidGcodeOff', setAttrs: setSettingsAttrs, description: 'Fluid OFF Gcode', rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                                            </div>
                                        </Collapse>
                                    </div>
                                </Collapse>
                            </div>
                        </Collapse>
                        <hr />
                        <ToggleField {... { object: this.props.settings, field: 'machineAEnabled', setAttrs: setSettingsAttrs, description: 'A Stage Support', info: Info(<p className="help-block">
                                    Allows controlling and visualising machines and gcode which use 'A' as an additional rotational axis around the X plane.
                                    </p>,"A-axis") }} />
                            <Collapse in={this.props.settings.machineAEnabled}>
                                <div>
                                    <NumberField {...{ errors: this.state.errors, object: this.props.settings, field: 'machineAAxisDiameter', setAttrs: setSettingsAttrs, description: 'A Axis diameter', info: Info(<p className="help-block">
                                        Default diameter for the A Axis, used to calculate A axis rotation angle during laser cutting and rastering.<br/>Not used in Mill or Lathe operations.
                                        </p>,"Mill and Lathe rapid movement Z height"), labelAddon: false, units: 'mm' }} />
                                </div>
                            </Collapse>

                    </SettingsPanel>

                    <SettingsPanel collapsible header="File Settings" eventKey="2" bsStyle="info" errors={this.state.errors}>
                        <h5 className="header">SVG import</h5>
                        <NumberField {...{ object: this.props.settings, field: 'pxPerInch', setAttrs: setSettingsAttrs, description: 'PX Per Inch', units: 'pxpi', info: Info(<p className="help-block">
                                    If the Pixels/Inch value is not specified in the SVG file, assume this value<br/>
                                    See <a href="https://wiki.inkscape.org/wiki/index.php/Units_In_Inkscape" target="_blank'"><strong>here</strong></a> for more.
                                    </p>,"Default PxPi for SVG files") }} />
                        <ToggleField {...{ object: this.props.settings, field: 'forcePxPerInch', setAttrs: setSettingsAttrs, description: 'Force PX Per Inch', info: Info(<p className="help-block">
                                    If the PxPi value in the imported SVG file is causing it to appear badly scaled, override it here.
                                    </p>,"Override PxPi") }} />
                        <NumberField {...{ object: this.props.settings, field: 'svgPrecision', setAttrs: setSettingsAttrs, description: 'SVG precision', units: '', info: Info(<p className="help-block">
                                    Specify how many decimal places the imported SVG paths should use.<br/>
                                    Reduce this setting if imported SVG files show fill errors (incorrectly filled solids)<br/>
                                    This is in workspace units calculated after applying DPI adjustments (eg; mm)
                                    </p>,"Decimal resolution for imported SVG files") }} />
                        <h5 className="header">Default path color {Info(<p className="help-block">This color will be used to display paths when they have no color defined in the file</p>,"Default stroke color")}
                        <span style={{float: "right"}}>
                            <ColorPicker to="hex" icon="pencil" bsSize="medium" color={this.props.settings.svgStrokeColor} onClick={v=>this.props.settings.svgStrokeColor=v}/>
                        </span>
                        </h5>
                        <NumberField {...{ object: this.props.settings, field: 'svgFillOpacity', setAttrs: setSettingsAttrs, description: 'Fill opacity', units: '%', info: Info(<p className="help-block">
                                    Opacity for filled areas, allows paths concealed by fill to be seen, but fill can look less solid.<br/>
                                    Only applies to the view in the Workspace and raster merges, cutting operations ignore opacity when calculating laser power.
                                    </p>,"SVG Fill opacity") }} />
                        <hr />
                        <h5 className="header">Images</h5>
                        <NumberField {...{ object: this.props.settings, field: 'dpiBitmap', setAttrs: setSettingsAttrs, description: 'Bitmap DPI', units: 'dpi', info: Info(<p className="help-block">
                                    Default DPI setting to be used for imported bitmaps.
                                    </p>,"DPI Default") }} />
                        <hr />
                        <h5 className="header">Filenames</h5>
                        <TextField {...{ object: this.props.settings, field: 'gcodeFilename', setAttrs: setSettingsAttrs, description: 'Gcode file name', info: Info(<p className="help-block">
                            Supports <em>strftime()</em> alike date/time formatting; see <a href="https://thdoan.github.io/strftime/" target="_blank"><strong>this page</strong></a> for more.<br/>
                            eg: <em>gcode-%y%m%d-%H%M</em><br/>
                            The file extension defined below will be appended as required.<br/>
                            </p>,"Gcode Default Filename"), rows: 1, style: { resize: "none", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeExtension', setAttrs: setSettingsAttrs, description: 'Gcode file extension', info: Info(<p className="help-block">
                            Define the default extension added to Gcode filenames, eg <em>.gcode</em> (default), <em>.gc</em>, <em>.nc</em>, <em>.tap</em>, <em>.cnc</em> etc.<br/>
                            </p>,"Gcode Default File Extension"), rows: 1, style: { resize: "none", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'workspaceFilename', setAttrs: setSettingsAttrs, description: 'Workspace file name', info: Info(<p className="help-block">
                            Supports <em><a href="https://thdoan.github.io/strftime/" target="_blank">strftime()</a></em> formatting in the same manner as for Gcode filenames.<br/>
                            eg: <em>Laserweb-Workspace-%y%m%d-%H%M</em><br/>
                            The <strong>.json</strong> extension will be appended as required.<br/>
                            </p>,"Workspace Default Filename"), rows: 1, style: { resize: "none", fontFamily: "monospace, monospace" } }} />
                    </SettingsPanel>

                    <SettingsPanel collapsible header="Gcode" eventKey="3" bsStyle="info" errors={this.state.errors}>
                        <SelectField {...{ object: this.props.settings, field: 'gcodeGenerator', setAttrs: setSettingsAttrs, data: ['default', 'legacy-marlin'], defaultValue: 'default', description: 'GCode Generator', info: Info(<p className="help-block">
                                    Some firmware (at present, only Marlin) requires different handling of gcode to set tool power during active moves,
                                    use this option if you require it.
                                    </p>,"Gcode Flavor"), selectProps: { clearable: false } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeStart', setAttrs: setSettingsAttrs, description: 'Laser Gcode Start', info: Info(<p className="help-block">
                            Start Gcode<br/>- Commands placed here will be executed at the start of the job.
                            </p>,"Start Gcode for Laser Operations"), rows: 5, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeEnd', setAttrs: setSettingsAttrs, description: 'Laser Gcode End', info: Info(<p className="help-block">
                            End Gcode.<br/>- Commands placed here will be executed at the end of the job.
                            </p>,"End Gcode for Laser Operations"), rows: 5, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <Collapse in={this.props.settings.machineMillEnabled}>
                            <div>
                                <TextField {...{ object: this.props.settings, field: 'gcodeMillStart', setAttrs: setSettingsAttrs, description: 'Mill / Lathe Gcode Start', info: Info(<p className="help-block">
                                    Optional: Alternative start gcode for mill or lathe jobs.<br/>- If left blank the laser start gcode will be used by default.
                                    </p>,"Start Gcode for Mill and Lathe Operations"), rows: 5, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                                <TextField {...{ object: this.props.settings, field: 'gcodeMillEnd', setAttrs: setSettingsAttrs, description: 'Mill / Lathe Gcode End', info: Info(<p className="help-block">
                                    Optional: Alternative end gcode for mill or lathe jobs.<br/>- If left blank the laser end gcode will be used by default.
                                    </p>,"End Gcode for Mill and Lathe Operations"), rows: 5, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                            </div>
                        </Collapse>
                        <TextField {...{ object: this.props.settings, field: 'gcodeHoming', setAttrs: setSettingsAttrs, description: 'Homing Gcode', info: Info(<p className="help-block">
                            Code used to home the machine.
                            </p>,"Homing Gcode"), rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeToolOn', setAttrs: setSettingsAttrs, description: 'Laser Tool ON Gcode', info: Info(<p className="help-block">
                            Optional: Gcode commands to run before each powered laser cut sequence in the generated code.<br/>- Use for firmwares without safe laser modes.<br/>- Not used in Mill/Lathe operations.<br/>- The keyword <strong>$INTENSITY</strong> will be replaced by the calculated power value.
                            </p>,"Laser Tool On Gcode"), rows: 3, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeToolOff', setAttrs: setSettingsAttrs, description: 'Laser Tool OFF Gcode', info: Info(<p className="help-block">
                            Optional: Gcode commands to run after each powered laser cut sequence in the generated code.<br/>- Use for firmwares without safe laser modes.<br/>- Not used in Mill/Lathe operations.<br/><br/><strong>If your machine does not automatically switch off the laser when movement stops (safe laser mode) you must ensure this is set correctly!</strong>
                            </p>,"Laser Tool Off Gcode"), rows: 3, style:{ resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <TextField {...{ object: this.props.settings, field: 'gcodeLaserIntensity', setAttrs: setSettingsAttrs, description: 'Laser Intensity Command', info: Info(<p className="help-block">
                            Tool power setting gcode command; the numeric power value will be appended to this prefix<br/>Eg: 'S' becomes 'S1000'.
                            </p>,"Tool power setting command prefix"), style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                        <ToggleField {... { object: this.props.settings, field: 'gcodeLaserIntensitySeparateLine', setAttrs: setSettingsAttrs, description: 'Intensity Separate Line', info: Info(<p className="help-block">
                            Place the intensity setting command on a seperate line in the generated code instead of being appended to the G1 movement command.
                            </p>,"Tool power setting commands on separate line") }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeSMinValue', setAttrs: setSettingsAttrs, description: 'PWM Min value', info: Info(<p className="help-block">
                                    Minimum PWM value for the tool, corresponding to zero power.<br/>Typically 0, but some machines, especially gas lasers, may use other values.
                                    </p>,"Minimum PWM") }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeSMaxValue', setAttrs: setSettingsAttrs, description: 'PWM Max value', info: Info(<p className="help-block">
                                    Maximum PWM value for the tool, corresponding to 100% power.<br/>This may vary by firmware, typically 255 or 1024 etc.
                                    </p>,"Maximum PWM") }} />
                        <h5 className="header">Tool Test</h5>
                        <NumberField {...{ object: this.props.settings, field: 'gcodeToolTestPower', setAttrs: setSettingsAttrs, description: 'Power', info: Info(<p className="help-block">
                                    Power level setting for the Tool Test, as a percentage of the total power range defined above.
                                    </p>,"Test Power"), units: '%' }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeToolTestDuration', setAttrs: setSettingsAttrs, description: 'Duration', info: Info(<p className="help-block">
                                    Only run the tool test for this duration, if set to zero the test will run indefinately until cancelled by the user or a move command.
                                    </p>,"Test Duration"), units: 'ms' }} />
                        <h5 className="header">Size Checking</h5>
                        <NumberField {...{ object: this.props.settings, field: 'gcodeCheckSizePower', setAttrs: setSettingsAttrs, description: 'Power', info: Info(<p className="help-block">
                                    Power level setting that will be applied while running a gcode size check.<br/>Note that size checking does not turn the tool on automatically, but it does override any existing power setting with this value.
                                    </p>,"Size Check Power"), units: '%' }} />
                        <h5 className="header">Gcode generation</h5>
                        <NumberField {...{ object: this.props.settings, field: 'gcodeSegmentLength', setAttrs: setSettingsAttrs, description: 'Segment', info: Info(<p className="help-block">
                            Minimum path segment length; imported (SVG) path segments shorter then this length will be combined.<br/>This improves Gcode generation performance and decreases code size for imported vectors with very fine resolution.
                            </p>,"Path Segment Length"), units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeCurvePrecision', setAttrs: setSettingsAttrs, description: 'Curve Linearization', info: Info(<p className="help-block">
                            Enter from 0.1 (Ultra High Precision - Slow) to 2.0 (Low Precision - Fast) to achieve different levels of curve to gcode performance.<br/>
                            </p>,"Gcode linearization factor"), units: ''} } />
                        <NumberField {...{ object: this.props.settings, field: 'gcodeConcurrency', setAttrs: setSettingsAttrs, description: 'CPU Threads', info: Info(<p className="help-block">
                            Increasing this can improve gcode generation performance when working with with lots of individual operations.<br/>
                            This is applied per operation, indvidual operations are <em>not</em> threaded and will not benefit from this option.<br/>
                            </p>,"Gcode Generation Threads"), units: '' }} />
                        <hr />
                        <TextField {...{ object: this.props.settings, field: 'gcodeHeader', setAttrs: setSettingsAttrs, description: 'Gcode Header', info: Info(<p className="help-block">
                            Text here will be placed in a commented (;) block at the start of the gcode.<br/>
                            The keywords <em><strong>$VERSION</strong></em> and <em><strong>$PROFILE</strong></em> will be replaced by the LaserWeb version and selected machine profile.<br/>
                            You can use <em>strftime()</em> alike date/time formattingi to add a timestamp; see <a href="https://thdoan.github.io/strftime/" target="_blank"><strong>this page</strong></a> for more.<br/>
                            </p>,"Gcode Identification"), rows: 5, style: { resize: "vertical", fontFamily: "monospace, monospace" } }} />
                    </SettingsPanel>

                    <SettingsPanel collapsible header="Application" eventKey="4" bsStyle="info" errors={this.state.errors}>
                        <h5 className="header">Interface</h5>
                        <SelectField {...{ object: this.props.settings, field: 'toolFeedUnits', setAttrs: setSettingsAttrs, data: ['mm/s', 'mm/min'], defaultValue: 'mm/min', description: 'Feed Units', info: Info(<p className="help-block">
                            Use 'mm/s' or 'mm/min' when specifying feed rates in operations.<br/>The feedrate in the resulting GCode will always be in mm/min.
                            </p>,"Feed rate units for interface"), selectProps: { clearable: false } }} />
                        <ToggleField {...{ object: this.props.settings, field: 'showMachine', setAttrs: setSettingsAttrs, description: 'Show Machine', info: Info(<p className="help-block">
                                    Highlight the machine work area in the display.
                                    </p>,"Show Work Area") }} />

                        <h5 className="header">Colors  {Info(<p className="help-block">Select the colors used for the workspace background and machine bed, when shown.</p>,"Workspace display colors")}
                        <span style={{float: "right"}}>
                            {this.props.settings.showMachine &&
                                <ColorPicker style={{paddingRight: '0.5em'}} to="hex" icon="square-o" bsSize="medium" color={this.props.settings.workSpaceColor} onClick={v=>this.props.settings.workSpaceColor=v}/>
                            }
                            <ColorPicker to="hex" icon="th" bsSize="medium" color={this.props.settings.workBedColor} onClick={v=>this.props.settings.workBedColor=v}/>
                        </span>
                        </h5>
                        <h5 className="header">Grid</h5>
                        <small className="help-block"><Label bsStyle="warning" style={{float: "left"}}>Caution!</Label>
                        &nbsp;&nbsp;Very large or dense grids will affect display performance.</small>
                        <NumberField {...{ object: this.props.settings, field: 'toolGridWidth', setAttrs: setSettingsAttrs, description: 'Grid Width', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'toolGridHeight', setAttrs: setSettingsAttrs, description: 'Grid Height', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'toolGridMinorSpacing', setAttrs: setSettingsAttrs, description: 'Minor Spacing', units: 'mm' }} />
                        <NumberField {...{ object: this.props.settings, field: 'toolGridMajorSpacing', setAttrs: setSettingsAttrs, description: 'Major Spacing', units: 'mm' }} />
                        <small className="help-block"><Label bsStyle="warning" style={{float: "left"}}>Important:</Label>
                        &nbsp;&nbsp;Grid spacing and color changes require an application reload.</small>
                        <div style={{textTransform: "uppercase", fontSize: "80%"}} >Axis Colors {Info(<p className="help-block">Select the colors used for the major grid axis labels.</p>,"Grid Colors")}
                        <span style={{float: "right"}}>
                            <ColorPicker style={{paddingRight: '0.5em'}} to="hex" icon="arrows-v" bsSize="medium" color={this.props.settings.toolGridYColor} onClick={v=>this.props.settings.toolGridYColor=v}/>
                            <ColorPicker to="hex" icon="arrows-h" bsSize="medium" color={this.props.settings.toolGridXColor} onClick={v=>this.props.settings.toolGridXColor=v}/>
                        </span>
                        </div>
                        <hr/>
                        <h5 className="header">Workspace</h5>
                        <ToggleField {... { object: this.props.settings, field: 'toolCreateEmptyOps', setAttrs: setSettingsAttrs, description: 'Create Empty Operations',info: Info(<p className="help-block">
                            Allows creation of operations in UI even when no documents are selected.<br/>Useful when preparing workspace templates for future use.</p>) }} />
                        <QuadrantField {... { object: this.props.settings, field: 'toolImagePosition', setAttrs: setSettingsAttrs, description: 'Raster Image Position', info: Info(<p className="help-block">
                            Controls how images are repositioned during raster optimisation.
                            </p>,"Raster optimisation placement") }} />
                        <br/>
                        <hr/>
                        <h5 className="header">Control</h5>
                        <ToggleField {... { object: this.props.settings, field: 'toolUseNumpad', setAttrs: setSettingsAttrs, description: 'Use Numpad', info: Info(<p className="help-block">
                        X <Label>4</Label> <Label>6</Label><br/>
                        Y <Label>2</Label> <Label>8</Label><br/>
                        Z <Label>+</Label> <Label>-</Label><br/>
                        A <Label>*</Label> <Label>/</Label>
                        </p>,"Jog using Numpad")}} />

                        <ToggleField {... { object: this.props.settings, field: 'toolUseGamepad', setAttrs: setSettingsAttrs, description: 'Use Gamepad',info: Info(<p className="help-block">
                            Gamepad for jogging. Use analog left stick (XY) or right stick (Z) to move on Jog tab.</p>) }} />
                        <hr/>
                        <h5 className="header">Simulator</h5>
                        <NumberField {...{ object: this.props.settings, field: 'simG0Rate', setAttrs: setSettingsAttrs, description: 'G0 speed', info: Info(<p className="help-block">
                            Set to the travel speed of your machine for accurate simulation rates.<br/>
                            </p>,"Simulation G0 Travel Speed"), units: 'mm/min'} } />
                        <NumberField {...{ object: this.props.settings, field: 'simBarWidth', setAttrs: setSettingsAttrs, description: 'Slider Width', info: Info(<p className="help-block">
                            Changes the width of the simulator slider in the GUI, this can give more simulator precision at the expense of reducing the console width.<br/>
                            </p>,"Simulator Slider Width"), units: 'em'} } />
                        <hr/>
                        <h5 className="header">Performance</h5>
                        <ToggleField {... { object: this.props.settings, field: 'toolDisplayCache', setAttrs: setSettingsAttrs, description: 'Display Cache', info: Info(<p className="help-block">
                            Disables continual update of the workspace display while idle.<br/>
                            This can reduce idle CPU use in your browser, but some events (eg simulation progress) may not update the display immediately.
                            </p>,"Cache display instead of continually redrawing") }} />
                    </SettingsPanel>

                    <Panel collapsible header="Camera" bsStyle="info" eventKey="6">
                        <div id="novideodevices" style={{ display: "none" }}>
                            <h5 className="header">Video Device List Unavailable</h5>
                            <small className="help-block">This may be due to running over an insecure connection, blocking in browser preferences, or other privacy protections.</small>
                        </div>
                        <div id="localvideodevices">
                            <table width="100%"><tbody><tr>
                                <td width="45%"><VideoDeviceField {...{ object: this.props.settings, field: 'toolVideoDevice', setAttrs: setSettingsAttrs, description: 'Video Device', disabled: !!this.props.settings['toolWebcamUrl']}} /></td>
                                <td width="45%"><VideoResolutionField {...{ object: this.props.settings, field: 'toolVideoResolution', setAttrs: setSettingsAttrs, deviceId: this.props.settings['toolVideoDevice'] }} /></td>
                            </tr></tbody></table>
                            <ToggleField  {... { object: this.props.settings, field: 'toolVideoOMR', setAttrs: setSettingsAttrs, description: 'Activate OMR', info: Info(<p className="help-block">
                            Enabling this, ARUCO markers will be recognized by floating camera port, allowing stock alignment. <Label bsStyle="warning">Experimental!</Label>
                            </p>,"Optical Mark Recognition"), disabled:!this.props.settings['toolVideoDevice'] }} />
                            <Collapse in={this.props.settings.toolVideoOMR}>
                                <div>
                                    <NumberField {...{ object: this.props.settings, field: 'toolVideoOMROffsetX', setAttrs: setSettingsAttrs, description: 'Camera offset X', units:'mm'  }} />
                                    <NumberField {...{ object: this.props.settings, field: 'toolVideoOMROffsetY', setAttrs: setSettingsAttrs, description: 'Camera offset Y', units:'mm' }} />
                                    <NumberField {...{ object: this.props.settings, field: 'toolVideoOMRMarkerSize', setAttrs: setSettingsAttrs, description: 'Marker size', units:'mm' }} />
                                    <ArucoMarker />
                                </div>
                            </Collapse>
                        </div>
                        <hr/>
                        <VideoPort height={240} enabled={(this.props.settings['toolVideoDevice'] !== null) || (this.props.settings['toolWebcamUrl'])} />
                        <TextField   {... { object: this.props.settings, field: 'toolWebcamUrl', setAttrs: setSettingsAttrs, description: 'Webcam Url' }} disabled={this.props.settings['toolVideoDevice'] !== null} />
                    </Panel>

                    <Panel collapsible header="Macros" bsStyle="info" eventKey="7">
                        <Macros />
                    </Panel>

                    <Panel collapsible header="Tools" bsStyle="danger" eventKey="8" >
                        <div className="help-block"><Label bsStyle="warning" style={{float: "left"}}>Danger!</Label><br/>
                        Loading profiles and settings will overwrite your current settings, use the tools here with care.</div>
                        <section>
                            <table style={{ width: 100 + '%' }}><tbody><tr><td><strong>Settings</strong></td>
                                <td><ApplicationSnapshotToolbar loadButton saveButton stateKeys={['settings']} label="Settings" saveName={settingsFileName} /></td></tr></tbody></table>
                        </section><br/>
                        <section>
                            <table style={{ width: 100 + '%' }}><tbody><tr><td><strong>Machine Profiles</strong></td>
                                <td><ApplicationSnapshotToolbar loadButton saveButton stateKeys={['machineProfiles']} label="Machine Profiles" saveName="laserweb-profiles.json" /></td></tr></tbody></table>
                        </section><br/>
                        <section>
                            <table style={{ width: 100 + '%' }}><tbody><tr><td><strong>Macros</strong></td>
                                <td><Button bsSize="xsmall" onClick={e => this.props.handleResetMacros()} bsStyle="warning" style={{float: "right"}}>Reset</Button></td></tr></tbody></table>
                        </section><br/>
                        <h5 className="header">Application Snapshot</h5>
                        <small className="help-block">
                        This dialog allows you to save or restore snapshots of the current application state. Use with care since this can overwrite any loaded work.</small>
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
            confirm("Are you sure? This will revert your macros to the machine default list.", (data) => { if (data !== null) dispatch({ type: "MACROS_RESET" }) })

        },
        handleSettingChange: (attrs) => {
            dispatch(setSettingsAttrs(attrs, 'settings'))
        },
        handleDownload: (file, settings, action) => {
            try{
                FileStorage.save(file, stringify(settings), "application/json",".json")
                dispatch(action(settings));
            } catch(e) {
                FileStorage.save(file, JSON.stringify(settings), "application/json",".json")
                dispatch(action(settings));
            }
        },
        handleUpload: (file, action, onlyKeys) => {
            FileStorage.load(file, (file, result) => {
                dispatch(action(file, result, onlyKeys));
            })
        },

        handleStore: (name, settings, action) => {
            try {
                LocalStorage.save(name, JSON.stringify(settings), "application/json")
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
