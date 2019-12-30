// Copyright 2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import Parser from '../lib/lw.svg-parser/parser';
import DxfParser from 'dxf-parser';
import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import { loadDocument, setDocumentAttrs, cloneDocumentSelected, selectDocuments,colorDocumentSelected,removeDocumentSelected } from '../actions/document';

import { setGcode, generatingGcode } from '../actions/gcode';
import { resetWorkspace } from '../actions/laserweb';
import { Documents } from './document';
import { withDocumentCache } from './document-cache'
import { GetBounds, withGetBounds } from './get-bounds.js';
import { Operations, Error } from './operation';
import { OperationDiagram } from './operation-diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';
import { sendAsFile, appendExt, openDataWindow, captureConsole } from '../lib/helpers';
import { ValidateSettings } from '../reducers/settings';
import { ApplicationSnapshotToolbar } from './settings';

import { Button, ButtonToolbar, ButtonGroup, ProgressBar, Alert } from 'react-bootstrap'
import Icon from './font-awesome'
import { alert, prompt, confirm } from './laserweb'

import CommandHistory from './command-history'
import { FileField, Info, ColorPicker, SearchButton } from './forms'

import { promisedImage, imageTagPromise } from './image-filters';

export const DOCUMENT_FILETYPES = '.png,.jpg,.jpeg,.bmp,.gcode,.g,.svg,.dxf,.tap,.gc,.nc'

function NoDocumentsError(props) {
    let { settings, documents, operations, camBounds } = props;
    if (documents.length === 0 && (operations.length === 0 || !settings.toolCreateEmptyOps))
        return <GetBounds Type="span"><Error operationsBounds={camBounds} message='Click here to begin' /></GetBounds>;
    else
        return <span />;
}

function GcodeProgress({ gcoding, onStop }) {
    return <div style={{ display: "flex", flexDirection: "row" }}><ProgressBar now={gcoding.percent} active={gcoding.enable} label={`${gcoding.percent}%`} style={{ flexGrow: 1, marginBottom: "0px" }} /><Button onClick={onStop} bsSize="xs" bsStyle="danger"><Icon name="hand-paper-o" /></Button></div>
}

GcodeProgress = connect((state) => { return { gcoding: state.gcode.gcoding } })(GcodeProgress)

export class CAMValidator extends React.Component {
    render() {
        let { noneOnSuccess, documents, className, style } = this.props;
        let errors = (!documents) ? "Add files to begin" : undefined
        if (noneOnSuccess && !errors) return null;
        return <span className={className} title={errors ? errors : "Good to go!"} style={style}><Icon name={errors ? 'warning' : 'check'} /></span>
    }
}

CAMValidator = connect((state) => { return { documents: state.documents.length } })(CAMValidator)

let __interval;

class Cam extends React.Component {

    constructor(props){
        super(props);
        this.state={filter:null}
    }

    componentWillMount() {
        let that = this
        window.generateGcode = e => {
            let { settings, documents, operations } = that.props;

            let percent = 0;
            __interval = setInterval(() => {
                that.props.dispatch(generatingGcode(true, isNaN(percent) ? 0 : Number(percent)));
            }, 100)

            let QE = getGcode(settings, documents, operations, that.props.documentCacheHolder,
                (msg, level) => { CommandHistory.write(msg, level); },
                (gcode) => {
                    clearInterval(__interval)
                    that.props.dispatch(setGcode(gcode));
                    that.props.dispatch(generatingGcode(false))
                },
                (threads) => {
                    percent = ((Array.isArray(threads)) ? (threads.reduce((a, b) => a + b, 0) / threads.length) : threads).toFixed(2);
                }
            );
            return QE;
        }

        this.generateGcode.bind(this)
        this.stopGcode.bind(this)
    }

    generateGcode(e) {
        this.QE = window.generateGcode(e);
    }

    stopGcode(e) {
        if (this.QE) { this.QE.end(); }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.documents !== this.props.documents ||
            nextProps.operations !== this.props.operations ||
            nextProps.currentOperation !== this.props.currentOperation ||
            nextProps.bounds !== this.props.bounds ||
            nextProps.gcode !== this.props.gcode ||    // Needed for saveGcode() to work
            nextProps.gcoding.percent !== this.props.gcoding.percent ||
            nextProps.gcoding.enable !== this.props.gcoding.enable ||
            nextState.filter !== this.state.filter
        );
    }

    

    render() {
        let { settings, documents, operations, currentOperation, toggleDocumentExpanded, loadDocument, bounds } = this.props;
        let validator = ValidateSettings(false)
        let valid = validator.passes();
        let someSelected=documents.some((i)=>(i.selected));
        
        return (
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="panel panel-danger" style={{ marginBottom: 0 }}>
                    <div className="panel-heading" style={{ padding: 2 }}>
                        <table style={{ width: 100 + '%' }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <label>Workspace</label>
                                    </td>
                                    <td>
                                        <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['documents', 'operations', 'currentOperation', 'settings.toolFeedUnits']} saveName="Laserweb-Workspace.json" label="Workspace" className="well well-sm">
                                            <Button bsSize="xsmall" bsStyle="warning" onClick={e => this.props.resetWorkspace(e)}>Reset <Icon name="trash" /></Button>
                                        </ApplicationSnapshotToolbar>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="Resizer horizontal" style={{ marginTop: '2px', marginBottom: '2px' }}></div>
                <div className="panel panel-info" style={{ marginBottom: 3 }}>
                    <div className="panel-heading" style={{ padding: 2 }}>
                        <table style={{ width: 100 + '%' }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <label>Documents {Info(<small>Tip:  Hold <kbd>Ctrl</kbd> to click multiple documents</small>)}</label>
                                    </td>
                                    <td style={{display:"flex", justifyContent: "flex-end" }}>
                                        
                                        <FileField style={{   position: 'relative', cursor: 'pointer' }} onChange={loadDocument} accept={DOCUMENT_FILETYPES}>
                                            <button title="Add a DXF/SVG/PNG/BMP/JPG document to the document tree" className="btn btn-xs btn-primary"><i className="fa fa-fw fa-folder-open" />Add Document</button>
                                            {(this.props.panes.visible) ? <NoDocumentsError camBounds={bounds} settings={settings} documents={documents} operations={operations} /> : undefined}
                                        </FileField>&nbsp;
                                    </td>
                                </tr>
                               
                            </tbody>
                        </table>
                    </div>
                </div>
                <Splitter style={{ flexShrink: 0 }} split="horizontal" initialSize={100} resizerStyle={{ marginTop: 2, marginBottom: 2 }} splitterId="cam-documents">
                    <div style={{height:"100%", display:"flex", flexDirection:"column"}} >
                        <div style={{ overflowY: 'auto', flexGrow:1 }}><Documents documents={documents} filter={this.state.filter} toggleExpanded={toggleDocumentExpanded} /></div>
                        {documents.length ? <ButtonToolbar bsSize="xsmall" bsStyle="default">
                            
                            <ButtonGroup>
                                <Button  bsStyle="info" bsSize="xsmall" onClick={e=>{this.props.dispatch(selectDocuments(true))}} title="Select all"><Icon name="cubes"/></Button>
                                <Button  bsStyle="default" bsSize="xsmall" onClick={e=>{this.props.dispatch(selectDocuments(false))}} title="Select none"><Icon name="cubes"/></Button>
                            </ButtonGroup>
                            <Button  bsStyle="warning" bsSize="xsmall" disabled={!someSelected} onClick={e=>{this.props.dispatch(cloneDocumentSelected())}} title="Clone selected"><Icon name="copy"/></Button>
                            <Button  bsStyle="danger" bsSize="xsmall" disabled={!someSelected} onClick={e=>{this.props.dispatch(removeDocumentSelected())}} title="Remove selected"><Icon name="trash"/></Button>
                            <ButtonGroup>
                                <ColorPicker to="rgba" icon="pencil" bsSize="xsmall" disabled={!someSelected} onClick={v=>this.props.dispatch(colorDocumentSelected({strokeColor:v||[0,0,0,1]}))}/>
                                <ColorPicker to="rgba" icon="paint-brush" bsSize="xsmall" disabled={!someSelected} onClick={v=>this.props.dispatch(colorDocumentSelected({fillColor:v||[0,0,0,0]}))}/>
                            </ButtonGroup>
                            <SearchButton bsStyle="primary" bsSize="xsmall" search={this.state.filter} onSearch={filter=>{this.setState({filter})}} placement="bottom"><Icon name="search"/></SearchButton>
                            </ButtonToolbar>:undefined}
                    </div>
                </Splitter>
                <Alert bsStyle="success" style={{ padding: "4px", marginBottom: 7 }}>
                    <table style={{ width: 100 + '%' }}>
                        <tbody>
                            <tr>
                                <th>GCODE</th>
                                <td style={{ width: "80%", textAlign: "right" }}>{!this.props.gcoding.enable ? (
                                    <ButtonToolbar style={{ float: "right" }}>
                                        <button title="Generate G-Code from Operations below" className={"btn btn-xs btn-attention " + (this.props.dirty ? 'btn-warning' : 'btn-primary')} disabled={!valid || this.props.gcoding.enable} onClick={(e) => this.generateGcode(e)}><i className="fa fa-fw fa-industry" />&nbsp;Generate</button>
                                        <ButtonGroup>
                                            <button title="View generated G-Code. Please disable popup blockers" className="btn btn-info btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.viewGcode}><i className="fa fa-eye" /></button>
                                            <button title="Export G-code to File" className="btn btn-success btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.saveGcode}><i className="fa fa-floppy-o" /></button>
                                            <FileField onChange={this.props.loadGcode} disabled={!valid || this.props.gcoding.enable} accept=".gcode,.gc,.nc">
                                                <button title="Load G-Code from File" className="btn btn-danger btn-xs" disabled={!valid || this.props.gcoding.enable} ><i className="fa fa-folder-open" /></button>
                                            </FileField>
                                        </ButtonGroup>
                                        <button title="Clear" className="btn btn-warning btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.clearGcode}><i className="fa fa-trash" /></button>
                                    </ButtonToolbar>) : <GcodeProgress onStop={(e) => this.stopGcode(e)} />}</td>
                            </tr>
                        </tbody>
                    </table>
                </Alert>
                <OperationDiagram {...{ operations, currentOperation }} />
                <Operations style={{ flexGrow: 2, display: "flex", flexDirection: "column" }} />
            </div>);
    }
};

Cam = connect(
    state => ({
        settings: state.settings, documents: state.documents, operations: state.operations, currentOperation: state.currentOperation, gcode: state.gcode.content, gcoding: state.gcode.gcoding, dirty: state.gcode.dirty, panes: state.panes,
        saveGcode: (e) => { prompt('Save as', 'gcode.gcode', (file) => { if (file !== null) sendAsFile(appendExt(file, '.gcode'), state.gcode.content) }, !e.shiftKey) },
        viewGcode: () => openDataWindow(state.gcode.content),
    }),
    dispatch => ({
        dispatch,
        toggleDocumentExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        clearGcode: () => {
            dispatch(setGcode(""))
        },
        resetWorkspace: () => {
            confirm("Are you sure?", (data) => { if (data) dispatch(resetWorkspace()); })
        },
        loadDocument: (e, modifiers = {}) => {
            // TODO: report errors
            for (let file of e.target.files) {
                let reader = new FileReader;
                if (file.name.substr(-4) === '.svg') {
                    reader.onload = () => {
                        const release = captureConsole()

                        //console.log('loadDocument: construct Parser');
                        let parser = new Parser({});
                        parser.parse(reader.result)
                            .then((tags) => {
                                let captures = release(true);
                                let warns = captures.filter(i => i.method == 'warn')
                                let errors = captures.filter(i => i.method == 'errors')
                                if (warns.length)
                                    CommandHistory.dir("The file has minor issues. Please check document is correctly loaded!", warns, 2)
                                if (errors.length)
                                    CommandHistory.dir("The file has serious issues. If you think is not your fault, report to LW dev team attaching the file.", errors, 3)

                                //onsole.log('loadDocument: imageTagPromise');
                                imageTagPromise(tags).then((tags) => {
                                    console.log('loadDocument: dispatch');
                                    dispatch(loadDocument(file, { parser, tags }, modifiers));
                                })
                            })
                            .catch((e) => {
                                //console.log('loadDocument: catch:', e);
                                release(true);
                                CommandHistory.dir("The file has serious issues. If you think is not your fault, report to LW dev team attaching the file.", String(e), 3)
                                console.error(e)
                            })

                    }
                    //console.log('loadDocument: readAsText');
                    reader.readAsText(file);
                }
                else if (file.name.substr(-4).toLowerCase() === '.dxf') {
                    reader.onload = () => {
                        var parser = new DxfParser();
                        var dxfTree = parser.parseSync(reader.result);
                        dispatch(loadDocument(file, dxfTree, modifiers));
                    }
                    reader.readAsText(file);
                }
                else if (file.type.substring(0, 6) === 'image/') {

                    reader.onload = () => {
                        promisedImage(reader.result)
                            .then((img) => {
                                dispatch(loadDocument(file, reader.result, modifiers, img));
                            })
                            .catch(e => console.log('error:', e))
                    }
                    reader.readAsDataURL(file);
                } else if (file.name.match(/\.(nc|gc|gcode)$/gi)) {
                    let reader = new FileReader;
                    reader.onload = () => dispatch(setGcode(reader.result));
                    reader.readAsText(file);
                }
                else {
                    reader.onload = () => dispatch(loadDocument(file, reader.result, modifiers));
                    reader.readAsDataURL(file);
                }
            }
        },
        loadGcode: e => {
            let reader = new FileReader;
            reader.onload = () => dispatch(setGcode(reader.result));
            reader.readAsText(e.target.files[0]);
        },
    }),
)(Cam);

Cam = withDocumentCache(withGetBounds(Cam));

export default Cam;
