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
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import Capture from './capture';
import Subtree from './subtree';
import { removeDocument, selectDocument, toggleSelectDocument } from '../actions/document';
import { addOperation, operationAddDocuments } from '../actions/operation';

class DocumentLabel extends React.Component {
    componentWillMount() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchCancel = this.onTouchCancel.bind(this);
    }

    onMouseDown(e) {
        this.needToSelect = false;
        this.isToggle = e.ctrlKey || e.shiftKey;
        this.dragStarted = false;
        if (this.props.object.selected)
            this.needToSelect = true;
        else if (this.isToggle)
            this.props.dispatch(toggleSelectDocument(this.props.object.id));
        else
            this.props.dispatch(selectDocument(this.props.object.id));
    }

    onTouchStart(e) {
        e.preventDefault();
        this.needToSelect = true;
        this.wasSelected = this.props.object.selected;
        this.dragStarted = false;
        if (!this.wasSelected)
            this.props.dispatch(toggleSelectDocument(this.props.object.id));
    }

    onMouseMove(e) {
        let elem = document.elementFromPoint(e.clientX, e.clientY);
        if (elem != ReactDOM.findDOMNode(this))
            this.dragStarted = true;
    }

    onTouchMove(e) {
        e.preventDefault();
        let touch = e.changedTouches[0];
        let elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elem != ReactDOM.findDOMNode(this)) {
            this.dragStarted = true;
            if (!this.wasSelected)
                this.props.dispatch(selectDocument(this.props.object.id));
        }
    }

    drag(clientX, clientY) {
        let elem = document.elementFromPoint(clientX, clientY);
        while (elem && !elem.dataset.operationId)
            elem = elem.parentElement;
        if (elem) {
            let documents = this.props.documents
                .filter(d => {
                    if (!d.selected)
                        return false;
                    for (let p of this.props.documents)
                        if (p.selected && p.children.includes(d.id))
                            return false;
                    return true;
                })
                .map(d => d.id);
            if (elem.dataset.operationId === 'new')
                this.props.dispatch(addOperation({ documents }));
            else
                this.props.dispatch(operationAddDocuments(elem.dataset.operationId, elem.dataset.operationTabs, documents));
        }
    }

    onMouseUp(e) {
        if (this.dragStarted) {
            this.drag(e.clientX, e.clientY);
        } else if (this.needToSelect) {
            if (this.isToggle)
                this.props.dispatch(toggleSelectDocument(this.props.object.id));
            else
                this.props.dispatch(selectDocument(this.props.object.id));
        }
        this.needToSelect = false;
        this.dragStarted = false;
    }

    onTouchEnd(e) {
        e.preventDefault();
        let touch = e.changedTouches[0];
        if (this.dragStarted)
            this.drag(touch.clientX, touch.clientY);
        else if (this.wasSelected)
            this.props.dispatch(toggleSelectDocument(this.props.object.id));
        this.needToSelect = false;
        this.dragStarted = false;
    }

    onTouchCancel(e) {
        e.preventDefault();
        this.needToSelect = false;
        this.dragStarted = false;
    }

    render() {
        let style;
        if (this.props.object.selected)
            style = { userSelect: 'none', cursor: 'grab', textDecoration: 'bold', color: '#FFF', paddingLeft: 5, paddingRight: 5, paddingBottom: 3, backgroundColor: '#337AB7', border: '1px solid', borderColor: '#2e6da4', borderRadius: 2 };
        // error = <E />;
        else
            style = { userSelect: 'none', cursor: 'copy', paddingLeft: 5, paddingRight: 5, paddingBottom: 3 };

        return (
            <Capture Component='span' style={style}
                onMouseDown={this.onMouseDown} onTouchStart={this.onTouchStart}
                onMouseMove={this.onMouseMove} onTouchMove={this.onTouchMove}
                onMouseUp={this.onMouseUp} onTouchEnd={this.onTouchEnd} onTouchCancel={this.onTouchCancel}>
                {this.props.object.name}
            </Capture>
        );
    }
};
DocumentLabel = connect(
    state => ({ documents: state.documents }),
)(DocumentLabel);

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
                .filter(document => document.isRoot)
                .map(document => (
                    <Subtree
                        key={document.id} objects={documents} object={document}
                        Label={DocumentLabel} Right={DocumentRight} rowNumber={rowNumber}
                        toggleExpanded={object => toggleExpanded(object)} />
                ))}
        </div>

    );
}
