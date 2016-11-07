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
import { Documents } from './document';
import { Operations } from './operation';
import { OperationDiagram } from './operation-diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';

class Cam extends React.Component {
    componentWillMount() {
        this.generate = e => {
            let {settings, documents, operations} = this.props;
            // TODO: show errors
            let gcode = getGcode(settings, documents, operations, msg => console.log(msg));
            console.log(gcode);
        }
    }

    render() {
        let {documents, operations, currentOperation, toggleDocumentExpanded, loadDocument} = this.props;
        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px #ccc dashed" }}>
                    <button onClick={this.generate}>Generate</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', }}>
                    <b>Documents</b>
                    <span style={{ float: 'right', position: 'relative' }}>
                        <button className="btn btn-xs"><i className="fa fa-upload" /></button>
                        <input onChange={loadDocument} type="file" multiple={true} value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                    </span>
                </div>
                <Splitter split="horizontal" initialSize={100} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-documents">
                    <div style={{ overflowY: 'auto' }}>
                        <Documents documents={documents} toggleExpanded={toggleDocumentExpanded} />
                    </div>
                </Splitter>
                <OperationDiagram {...{ operations, currentOperation }} />
                <div style={{ marginTop: 10 }}><b>Operations</b></div>
                <div style={{ flexGrow: 2, overflowY: 'auto' }}>
                    <Operations />
                </div>
            </div>);
    }
};

Cam = connect(
    state => ({ settings: state.settings, documents: state.documents, operations: state.operations, currentOperation: state.currentOperation }),
    dispatch => ({
        toggleDocumentExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        loadDocument: e => {
            // TODO: report errors
            for (let file of e.target.files) {
                let reader = new FileReader;
                reader.onload = () => dispatch(loadDocument(file, reader.result));
                if (file.name.substr(-4) === '.svg')
                    reader.readAsText(file);
                else
                    reader.readAsDataURL(file);
            }
        }
    }),
)(Cam);
export default Cam;
