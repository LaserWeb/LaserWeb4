import React from 'react'
import { connect } from 'react-redux';

import { loadDocument, setDocumentAttrs } from '../actions/document';
import { Documents } from './document';
import Splitter from './splitter';

function Cam({documents, toggleExpanded, onchange}) {
    return (
        <div style={{ overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <b>Documents</b>
                <span style={{ float: 'right', position: 'relative' }}>
                    <button className="btn btn-xs"><i className="fa fa-upload" /></button>
                    <input onChange={onchange} type="file" value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                </span>
            </div>
            <Splitter split="horizontal" initialSize={100} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-documents">
                <div style={{ overflowY: 'auto' }}>
                    <Documents documents={documents} toggleExpanded={toggleExpanded} />
                </div>
            </Splitter>
            <b>Operations</b>
            <Splitter split="horizontal" initialSize={100} resizerStyle={{ marginTop: 10, marginBottom: 10 }} splitterId="cam-operations">
                <div style={{ overflowY: 'auto' }}>
                    ...
                </div>
            </Splitter>
            <b>Operation Diagram goes here...</b>
        </div>);
}
Cam = connect(
    state => ({ documents: state.documents }),
    dispatch => ({
        toggleExpanded: d => dispatch(setDocumentAttrs({ expanded: !d.expanded }, d.id)),
        onchange: e => {
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
