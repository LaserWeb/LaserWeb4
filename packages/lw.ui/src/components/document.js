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

import Subtree from './subtree';
import { removeDocument, selectDocument, toggleSelectDocument, toggleVisibleDocument } from '../actions/document';
import { addOperation, operationAddDocuments } from '../actions/operation';
import { documents } from '../reducers/document';
import Pointable from '../lib/Pointable';

import Icon from './font-awesome';

function isSelected(documents, d) {
    if (!d.selected)
        return false;
    for (let p of documents)
        if (p.selected && p.children.includes(d.id))
            return false;
    return true;
}

export function selectedDocuments(documents) {
    return documents.filter(d => isSelected(documents, d)).map(d => d.id);
}

class DocumentLabel extends React.Component {
    componentWillMount() {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerCancel = this.onPointerCancel.bind(this);
    }

    onPointerDown(e) {
        e.preventDefault();
        ReactDOM.findDOMNode(this).setPointerCapture(e.pointerId);
        this.pointerType = e.pointerType;
        if (this.pointerType === 'pen' || this.pointerType === 'touch') {
            this.needToSelect = this.props.object.selected;
            this.isToggle = true;
            this.dragStarted = false;
            if (!this.props.object.selected)
                this.props.dispatch(toggleSelectDocument(this.props.object.id));
        } else {
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
    }

    onPointerMove(e) {
        if (e.pointerType !== this.pointerType)
            return;
        e.preventDefault();
        let elem = document.elementFromPoint(e.clientX, e.clientY);
        this.dragX = e.clientX;
        this.dragY = e.clientY;
        if (elem != ReactDOM.findDOMNode(this) && !this.dragStarted) {
            this.dragStarted = true;
            if ((this.pointerType === 'pen' || this.pointerType === 'touch') && !this.needToSelect)
                this.props.dispatch(selectDocument(this.props.object.id));
        }
        if (this.dragStarted)
            this.forceUpdate();
    }

    drag(clientX, clientY) {
        let elem = document.elementFromPoint(clientX, clientY);
        while (elem && !elem.dataset.operationId)
            elem = elem.parentElement;
        if (elem) {
            let documents = this.props.documents.filter(d => isSelected(this.props.documents, d)).map(d => d.id);
            if (elem.dataset.operationId === 'new')
                this.props.dispatch(addOperation({ documents }));
            else
                this.props.dispatch(operationAddDocuments(elem.dataset.operationId, elem.dataset.operationTabs, documents));
        }
    }

    onPointerUp(e) {
        if (e.pointerType !== this.pointerType)
            return;
        e.preventDefault();
        if (this.dragStarted) {
            this.drag(e.clientX, e.clientY);
            this.dragStarted = false;
        } else if (this.needToSelect) {
            if (this.isToggle)
                this.props.dispatch(toggleSelectDocument(this.props.object.id));
            else
                this.props.dispatch(selectDocument(this.props.object.id));
        }
        this.pointerType = '';
        this.forceUpdate();
    }

    onPointerCancel(e) {
        if (e.pointerType !== this.pointerType)
            return;
        e.preventDefault();
        this.dragStarted = false;
        this.pointerType = '';
        this.forceUpdate();
    }

    render() {
        let {documents} = this.props;
        let style;
        if (this.props.object.selected)
            style = { userSelect: 'none', cursor: 'grab', textDecoration: 'bold', color: '#FFF', paddingLeft: 5, paddingRight: 5, paddingBottom: 3, backgroundColor: '#337AB7', border: '1px solid', borderColor: '#2e6da4', borderRadius: 2 };
        else
            style = { userSelect: 'none', cursor: 'copy', paddingLeft: 5, paddingRight: 5, paddingBottom: 3 };
        let dragDiv;
        if (this.dragStarted)
            dragDiv = (
                <div style={{ position: 'absolute', zIndex: 1000, left: this.dragX, top: this.dragY, pointerEvents: 'none' }}>
                    <div style={{ position: 'relative', transform: 'translate(-50%,-50%)' }}>
                        {documents.filter(d => isSelected(documents, d)).map(doc =>
                            <div key={doc.id} style={{ color: '#FFF', backgroundColor: '#337AB7' }}>{doc.name}</div>)}
                    </div>
                </div>
            );

        return (
            <Pointable tagName='span' style={style}
                onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp} onPointerCancel={this.onPointerCancel}>
                {this.props.object.name}
                {dragDiv}
            </Pointable>
        );
    }
};
DocumentLabel = connect(
    state => ({ documents: state.documents }),
)(DocumentLabel);

function DocumentRight({object, dispatch}) {
    return (
        <div className="btn-group">
            <button
                className="btn btn-default btn-xs"
                onClick={e => dispatch(toggleVisibleDocument(object.id))}>
                <Icon name={(object.visible === true || object.visible === undefined) ? "eye" : "eye-slash"} />
            </button>
            <button
                className="btn btn-danger btn-xs"
                onClick={e => dispatch(removeDocument(object.id))}>
                <i className="fa fa-times"></i>
            </button>
        </div>
    );
}
DocumentRight = connect()(DocumentRight);

const getSelectedParents=(documents)=>{
    let objects = documents.filter(i=>i.selected);
    let tree=new Set();
    let getPath= (object) =>{
        let item = documents.find( item => item.children && item.children.includes(object.id));
            if (item) {
                tree.add(item.id);
                getPath(item);
            }

    }
    objects.forEach((i)=>getPath(i))
    return [...tree]
}

export function Documents({documents, toggleExpanded, filter}) {
    let rowNumber = { value: 0 };
    return (
        <div style={{ touchAction: 'none' }}>
            {documents
                .filter(document => !!filter || document.isRoot)
                .filter(document => {
                    return (document.name.indexOf(filter)>=0) || !filter
                })
                .map(document => (
                    <Subtree
                        key={document.id} objects={documents} object={document}
                        Label={DocumentLabel} Right={DocumentRight} rowNumber={rowNumber}
                        toggleExpanded={object => toggleExpanded(object)}
                        selectedDocuments={getSelectedParents(documents)} />
                ))}
        </div>

    );
}
