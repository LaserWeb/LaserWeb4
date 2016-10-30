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
import Splitter from './splitter';

function Cam({documents, operations, toggleDocumentExpanded, loadDocument}) {
    return (
        <div style={{ overflow: 'hidden', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', }}>
                <b>Documents</b>
                <span style={{ float: 'right', position: 'relative' }}>
                    <button className="btn btn-xs"><i className="fa fa-upload" /></button>
                    <input onChange={loadDocument} type="file" value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                </span>
            </div>
            <Splitter split="horizontal" initialSize={100} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-documents">
                <div style={{ overflowY: 'auto' }}>
                    <Documents documents={documents} toggleExpanded={toggleDocumentExpanded} />
                </div>
            </Splitter>
            <b>Operations</b>
            <Splitter split="horizontal" initialSize={400} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-operations">
                <div style={{ overflowY: 'auto' }}>
                    <Operations />
                </div>
            </Splitter>
            <b>Operation Diagram goes here...</b>
        </div>);
}
// TODO: move connect() to Documents
Cam = connect(
    state => ({ documents: state.documents }),
    dispatch => ({
        toggleDocumentExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        loadDocument: e => {
            // TODO: report errors
            // TODO: use readAsArrayBuffer() for some file types
            let file = e.target.files[0];
            let reader = new FileReader;
            reader.onload = () => dispatch(loadDocument(file, reader.result));
            reader.readAsText(file);
        }
    }),
)(Cam);
export default Cam;
