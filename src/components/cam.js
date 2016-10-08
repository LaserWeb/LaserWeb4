/**
 * CAM module.
 * @module
 */

import React from 'react'
import { connect } from 'react-redux';

import { loadDocument } from '../actions/document';
import { Documents } from './document';

function Cam({documents, onchange}) {
    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <b>Documents</b>
                <span style={{ float: 'right', position: 'relative' }}>
                    <button className="btn btn-xs"><i className="fa fa-upload" /></button>
                    <input onChange={onchange} type="file" value="" style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }} />
                </span>
            </div>
            <Documents documents={documents} />
        </div>);
}
Cam = connect(
    state => ({ documents: state.documents }),
    dispatch => ({
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
