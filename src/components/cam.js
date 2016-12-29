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
import React from 'react'
import { ButtonToolbar, ButtonGroup } from 'react-bootstrap'
import { connect } from 'react-redux';

import { loadDocument, setDocumentAttrs } from '../actions/document';
import { setGcode } from '../actions/gcode';
import { Documents } from './document';
import { withDocumentCache } from './document-cache'
import { GetBounds, withGetBounds } from './get-bounds.js';
import { Operations, Error } from './operation';
import { OperationDiagram } from './operation-diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';
import { sendAsFile } from '../lib/helpers';
import { ValidateSettings } from '../reducers/settings';
import { ApplicationSnapshotToolbar } from './settings';

function NoDocumentsError(props) {
    let {documents, camBounds} = props;
    if (documents.length === 0)
        return <GetBounds Type="span"><Error operationsBounds={camBounds} message='Click here to begin' /></GetBounds>;
    else
        return <span />;
}

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
        let {documents, operations, currentOperation, toggleDocumentExpanded, loadDocument, bounds} = this.props;
        let validator = ValidateSettings(false)
        let valid = validator.passes();

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['documents', 'operations', 'currentOperation']} label="Workspace" />
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
                                            <button className="btn btn-xs btn-primary"><i className="fa fa-fw fa-folder-open" />Add Document</button>
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
                <div className="panel panel-success" style={{ marginBottom: 3 }}>
                    <div className="panel-heading" style={{ padding: 2 }}>
                        <table style={{ width: 100 + '%' }}>
                            <tbody>
                                <tr>
                                    <td>
                                        <label>GCODE</label>
                                    </td>
                                    <td>
                                        <span style={{ float: 'right', position: 'relative', cursor: 'pointer' }}>
                                            <ButtonGroup title={"On Settings: " + Object.values(validator.errors.errors).join("\n")}>
                                                <button className="btn btn-success btn-xs" disabled={!valid} onClick={this.generate}><i className="fa fa-fw fa-industry" />&nbsp;Generate</button>
                                                <button className="btn btn-success btn-xs" disabled={!valid} onClick={this.props.saveGcode}><i className="fa fa-floppy-o" /></button>
                                            </ButtonGroup>
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan='2'>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <OperationDiagram {...{ operations, currentOperation }} />
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
                            .then(tags => dispatch(loadDocument(file, { parser, tags })))
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

Cam = withDocumentCache(withGetBounds(Cam));

export default Cam;
