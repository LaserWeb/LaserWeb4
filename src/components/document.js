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

import Subtree from './subtree';
import { removeDocument, selectDocument, toggleSelectDocument } from '../actions/document';

class DocumentLabel extends React.Component {
    componentWillMount() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
    }

    onMouseDown(e) {
        this.needToSelect = false;
        this.ctrlKey = e.ctrlKey;
        if (this.props.object.selected)
            this.needToSelect = true;
        else {
            if (e.ctrlKey)
                this.props.dispatch(toggleSelectDocument(this.props.object.id));
            else
                this.props.dispatch(selectDocument(this.props.object.id));
        }
    }

    onMouseUp(e) {
        if (this.needToSelect) {
            if (this.ctrlKey)
                this.props.dispatch(toggleSelectDocument(this.props.object.id));
            else
                this.props.dispatch(selectDocument(this.props.object.id));
        }
    }

    onDragStart(e) {
        this.needToSelect = false;
        let selected = this.props.documents.filter(d => {
            if (!d.selected)
                return false;
            for (let p of this.props.documents)
                if (p.selected && p.children.includes(d.id))
                    return false;
            return true;
        });
        e.nativeEvent.dataTransfer.setData('laserweb/docids', selected.map(d => d.id).join());
        e.nativeEvent.dataTransfer.setDragImage(document.createElement('div'), 0, 0);
    }

    render() {
        let style;
        if (this.props.object.selected)
            style = { userSelect: 'none', cursor: 'default', backgroundColor: 'blue', color: 'white' };
        else
            style = { userSelect: 'none', cursor: 'default' };
        return (
            <span style={style} onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onDragStart={this.onDragStart} draggable={true}>
                {this.props.object.name}
            </span>
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
