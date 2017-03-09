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

import Parser from 'lw.svg-parser';
import DxfParser from 'dxf-parser';
import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import { loadDocument, setDocumentAttrs } from '../actions/document';
import { setGcode, generatingGcode } from '../actions/gcode';
import { Documents } from './document';
import { withDocumentCache } from './document-cache'
import { GetBounds, withGetBounds } from './get-bounds.js';
import { Operations, Error } from './operation';
import { OperationDiagram } from './operation-diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';
import { sendAsFile, openDataWindow } from '../lib/helpers';
import { ValidateSettings } from '../reducers/settings';
import { ApplicationSnapshotToolbar } from './settings';

import { Button, ButtonToolbar, ButtonGroup, ProgressBar, Alert } from 'react-bootstrap'
import Icon from './font-awesome'

import CommandHistory from './command-history'

function NoDocumentsError(props) {
    let {documents, camBounds} = props;
    if (documents.length === 0)
        return <GetBounds Type="span"><Error operationsBounds={camBounds} message='Click here to begin' /></GetBounds>;
    else
        return <span />;
}

function GcodeProgress({gcoding, onStop}){
    return <div style={{display:"flex", flexDirection:"row"}}><ProgressBar now={gcoding.percent} active={gcoding.enable} label={`${gcoding.percent}%`} style={{flexGrow:1,marginBottom: "0px"}}/><Button onClick={onStop} bsSize="xs" bsStyle="danger"><Icon name="hand-paper-o"/></Button></div>
}

GcodeProgress = connect((state)=>{return {gcoding: state.gcode.gcoding}})(GcodeProgress)

class Cam extends React.Component {

 
    componentWillMount() {
            let that=this
            window.generateGcode = e => {
            
                let {settings, documents, operations} = that.props;
                
                let QE = getGcode(settings, documents, operations, that.props.documentCacheHolder, 
                    (msg,level) => { CommandHistory.log(msg,level);}, 
                    (gcode) => {
                        that.props.dispatch(generatingGcode(false))
                        that.props.dispatch(setGcode(gcode));
                    },
                    (percent) => {
                        that.props.dispatch(generatingGcode(true,percent))
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

    stopGcode(e){
        if (this.QE){
            this.QE.end();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.documents !== this.props.documents ||
            nextProps.operations !== this.props.operations ||
            nextProps.currentOperation !== this.props.currentOperation ||
            nextProps.bounds !== this.props.bounds ||
            nextProps.gcode !== this.props.gcode ||    // Needed for saveGcode() to work
            nextProps.gcoding.percent !== this.props.gcoding.percent ||
            nextProps.gcoding.enable !== this.props.gcoding.enable
        ); 
    }

    render() {
        let {documents, operations, currentOperation, toggleDocumentExpanded, loadDocument, bounds} = this.props;
        let validator = ValidateSettings(false)
        let valid = validator.passes();

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['documents', 'operations', 'currentOperation']} label="Workspace" className="well well-sm" />
                <div className="panel panel-info" style={{ marginBottom: 3 }}>
                    <div className="panel-heading" style={{ padding: 2 }}>
                        <table style={{ width: 100 + '%' }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <label>Documents</label>
                                    </td>
                                    <td>
                                        <span style={{ float: 'right', position: 'relative', cursor: 'pointer' }}>
                                            <button title="Add a DXF/SVG/PNG/BMP/JPG document to the document tree" className="btn btn-xs btn-primary"><i className="fa fa-fw fa-folder-open" />Add Document</button>
                                            <input onChange={loadDocument} type="file" multiple={true} value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                                            <NoDocumentsError camBounds={bounds} documents={documents} />
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan='2'>
                                        <small>Tip:  Hold <kbd>Ctrl</kbd> to click multiple documents</small>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <Splitter style={{ flexShrink: 0 }} split="horizontal" initialSize={100} resizerStyle={{ marginTop: 2, marginBottom: 2 }} splitterId="cam-documents">
                    <div style={{ overflowY: 'auto' }}>
                        <Documents documents={documents} toggleExpanded={toggleDocumentExpanded} />
                    </div>
                </Splitter>
                <Alert bsStyle="success" style={{padding: "4px"}}>
                    <table style={{ width: 100 + '%' }}>
                        <tbody><tr>
                            <th>GCODE</th>
                            <td style={{width:"80%", textAlign:"right"}}>{!this.props.gcoding.enable ? ( 
                                <ButtonToolbar style={{float:"right"}}>
                                <button title="Generate G-Code from Operations below" className={"btn btn-xs btn-attention "+(this.props.dirty?'btn-warning':'btn-primary')} disabled={!valid || this.props.gcoding.enable} onClick={(e)=>this.generateGcode(e)}><i className="fa fa-fw fa-industry" />&nbsp;Generate</button>
                                <ButtonGroup>
                        
                        <button title="View generated G-Code. Please disable popup blockers" className="btn btn-info btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.viewGcode}><i className="fa fa-eye" /></button>
                        <button title="Export G-code to File" className="btn btn-success btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.saveGcode}><i className="fa fa-floppy-o" /></button>
                        <button title="Load G-Code from File" className="btn btn-danger btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.loadGcode}><i className="fa fa-folder-open" /></button>
                    </ButtonGroup>
                        <button title="Clear" className="btn btn-warning btn-xs" disabled={!valid || this.props.gcoding.enable} onClick={this.props.clearGcode}><i className="fa fa-trash" /></button>
                    </ButtonToolbar>):<GcodeProgress onStop={(e)=>this.stopGcode(e)}/>}</td>
                        </tr></tbody>
                    </table>
                </Alert>
                <OperationDiagram {...{ operations, currentOperation }} />
                <Operations style={{ flexGrow: 2, display: "flex", flexDirection: "column" }} />
            </div>);
    }
};

Cam = connect(
    state => ({
        settings: state.settings, documents: state.documents, operations: state.operations, currentOperation: state.currentOperation, gcode: state.gcode.content, gcoding: state.gcode.gcoding, dirty:state.gcode.dirty,
        saveGcode: () => sendAsFile('gcode.gcode', state.gcode.content),
        viewGcode: () => openDataWindow(state.gcode.content),
    }),
    dispatch => ({
        dispatch,
        toggleDocumentExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        clearGcode: () => {
            dispatch(setGcode(""))
        },
        loadDocument: e => {
            // TODO: report errors
            for (let file of e.target.files) {
                let reader = new FileReader;
                if (file.name.substr(-4) === '.svg') {
                    reader.onload = () => {
                        let parser = new Parser({});
                        parser.parse(reader.result)
                            .then(tags => dispatch(loadDocument(file, { parser, tags })))
                            .catch(e => console.log('error:', e))
                    }
                    reader.readAsText(file);
                }
                else if (file.name.substr(-4).toLowerCase() === '.dxf') {
                    reader.onload = () => {
                        var parser = new DxfParser();
                        var dxfTree = parser.parseSync(reader.result);
                        dispatch(loadDocument(file, dxfTree));
                    }
                    reader.readAsText(file);
                }
                else if (file.type.substring(0, 6) === 'image/') {

                    const promisedImage = (path) => {
                        return new Promise(resolve => {
                            let img = new Image();
                            img.onload = () => { resolve(img) }
                            img.src = path;
                        })
                    }

                    reader.onload = () => {
                        promisedImage(reader.result)
                            .then((img) => {
                                dispatch(loadDocument(file, reader.result, img));
                            })
                            .catch(e => console.log('error:', e))
                    }
                    reader.readAsDataURL(file);
                }
                else {
                    reader.onload = () => dispatch(loadDocument(file, reader.result));
                    reader.readAsDataURL(file);
                }
            }
        },
        loadGcode: e => {
            let input = document.createElement('input');
            input.type = "file";
            input.onchange = e => {
                let reader = new FileReader;
                reader.onload = () => dispatch(setGcode(reader.result));
                reader.readAsText(e.target.files[0]);
            };
            input.click();
        },
    }),
)(Cam);

Cam = withDocumentCache(withGetBounds(Cam));

export default Cam;
