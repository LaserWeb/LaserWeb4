import React from 'react'
import { connect } from 'react-redux';

import Subtree from './subtree';
import { removeDocument } from '../actions/document';

function DocumentLabel({object}) {
    return (
        <span>
            {object.name}
        </span>
    );
}

function DocumentRight({object, dispatch}) {
    return (
        <button
            className="btn btn-danger btn-xs"
            onClick={e => dispatch(removeDocument(object.id))}>
            <i className="fa fa-times"></i>
        </button>
    );
}
DocumentRight = connect()(DocumentRight);

export function Documents({documents, toggleExpanded}) {
    let rowNumber = { value: 0 };
    return (
        <div>
            {documents
                .filter(document => document.type === 'document')
                .map(document => (
                    <Subtree
                        key={document.id} objects={documents} object={document}
                        Label={DocumentLabel} Right={DocumentRight} rowNumber={rowNumber}
                        toggleExpanded={object => toggleExpanded(object)} />
                ))}
        </div>
    );
}
