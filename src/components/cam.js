/**
 * CAM module.
 * @module
 */

import React from 'react'
import { connect } from 'react-redux';

import { Documents } from './document';

function Cam({documents, dispatch}) {
    return (
        <div>
            <b>Documents</b>
            <Documents documents={documents} />
        </div>);
}
Cam = connect(state => ({ documents: state.documents }))(Cam);
export default Cam;
