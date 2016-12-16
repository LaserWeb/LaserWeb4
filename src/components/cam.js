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

import React from 'react'
import { connect } from 'react-redux';

import { loadDocument, setDocumentAttrs } from '../actions/document';
import { setGcode } from '../actions/gcode';
import { Documents } from './document';
import { withDocumentCache } from './document-cache'
import { Operations } from './operation';
import { OperationDiagram } from './operation-diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';
import { sendAsFile } from '../lib/helpers';
import Parser from '../../lw.svg-parser/src/parser'

import { ValidateSettings } from '../reducers/settings';
import { SettingsValidator } from './settings';
import { ButtonToolbar } from 'react-bootstrap'




class Cam extends React.Component {
    componentWillMount() {
        this.generate = e => {
            let {settings, documents, operations} = this.props;
            // TODO: show errors
            let gcode = getGcode(settings, documents, operations, this.props.documentCacheHolder, msg => console.log(msg));
            this.props.dispatch(setGcode(gcode));
        }
    }

    render() {
        let {documents, operations, currentOperation, toggleDocumentExpanded, loadDocument} = this.props;

        let valid = ValidateSettings();

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', }}>
                    <b>Documents</b>
                    <span style={{ float: 'right', position: 'relative', cursor: 'pointer' }}>
                        <button className="btn btn-xs btn-primary"><i className="fa fa-fw fa-folder-open" />Add Document</button>
                        <input onChange={loadDocument} type="file" multiple={true} value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                    </span>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <small>Tip:  Hold <kbd>Ctrl</kbd> to click multiple documents</small>
                </div>
                <Splitter style={{ flexShrink: 0 }} split="horizontal" initialSize={100} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-documents">
                    <div style={{ overflowY: 'auto' }}>
                        <Documents documents={documents} toggleExpanded={toggleDocumentExpanded} />
                    </div>
                </Splitter>
                <h5>Gcode generation <SettingsValidator style={{ float: "right" }} /></h5>
                <OperationDiagram {...{ operations, currentOperation }} />
                <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px #ccc dashed" }}>
                    <ButtonToolbar>
                        <button className="btn btn-success btn-xs" disabled={!valid} onClick={this.generate}><i className="fa fa-fw fa-industry" />&nbsp;Generate GCode</button>
                        <button className="btn btn-primary btn-xs" disabled={!valid} onClick={this.props.saveGcode}><i className="fa fa-floppy-o" />&nbsp;Save GCode</button>
                    </ButtonToolbar>
                </div>
                <h5>Operations</h5>
                <Operations style={{ flexGrow: 2, display: "flex", flexDirection: "column" }} />
            </div>);
    }
};

Cam = connect(
    state => ({
        settings: state.settings, documents: state.documents, operations: state.operations, currentOperation: state.currentOperation,
        saveGcode: () => sendAsFile('gcode.gcode', state.gcode),
    }),
    dispatch => ({
        dispatch,
        toggleDocumentExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        loadDocument: e => {
            // TODO: report errors
            for (let file of e.target.files) {
                let reader = new FileReader;
                if (file.name.substr(-4) === '.svg') {
                    reader.onload = () => {
                        let parser = new Parser({});
                        parser.parse(reader.result)
                            .then(tags => dispatch(loadDocument(file, tags)))
                            .catch(e => console.log('error:', e))
                    }
                    reader.readAsText(file);
                } else {
                    reader.onload = () => dispatch(loadDocument(file, reader.result));
                    reader.readAsDataURL(file);
                }
            }
        }
    }),
)(Cam);

Cam = withDocumentCache(Cam);

export default Cam;
