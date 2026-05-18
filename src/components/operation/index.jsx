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
import { connect, useDispatch, useSelector } from 'react-redux';

import { removeOperation, moveOperation, operationRemoveDocument, setOperationAttrs, clearOperations } from '../../actions/operation';
import { selectDocument } from '../../actions/document'
import { addOperation } from '../../actions/operation'
import { hasClosedRawPaths } from '../../lib/mesh';

import { GetBounds } from '../get-bounds';
import { selectedDocuments } from '../document'

import { MaterialPickerButton, MaterialSaveButton } from '../material-database'

import { ButtonToolbar, Button } from 'react-bootstrap';
import Icon from '../font-awesome'

import { Details } from '../material-database'

import { confirm } from '../laserweb'

import "../../styles/context-menu.css";
import useBounds from '../../hooks/use-bounds';
import { checkGE0 } from './checks';
import { NumberInput } from './inputs';
import { OPERATION_FIELDS, OPERATION_GROUPS, OPERATION_TYPES } from './definitions';
import { Field } from './field';

export { OPERATION_FIELDS, OPERATION_GROUPS, OPERATION_TYPES };

export function Error({ bounds, operationsBounds, message }) {
    return (
        <div className="error-bubble-clip" style={{ left: operationsBounds.right, top: operationsBounds.top /*top: 0*/, bottom: 0 }}>
            <div style={{ height: operationsBounds.bottom - operationsBounds.top }}>
                <div className='error-bubble' style={{ top: (bounds.top + bounds.bottom) / 2 - operationsBounds.top }}>
                    <div className='error-bubble-arrow' />
                    <div className='error-bubble-message'>{message}</div>
                </div>
            </div>
        </div>
    );
}

function NoOperationsError({ documents, operations, operationsBounds }) {
    let [ boundsRef, bounds ] = useBounds();

    if (documents.length && !operations.length) {
        return <span ref={boundsRef}>
            <Error bounds={bounds} operationsBounds={operationsBounds} message='Drag Documents(s) Here' />
        </span>;
    } else {
        return <span />;
    }
}

function Doc({ documents, op, id, isTab }) {
    let dispatch = useDispatch();

    let docStyle = {
        userSelect: 'none', cursor: 'pointer',
        textDecoration: 'bold', color: '#FFF',
        paddingLeft: 5, paddingRight: 5, paddingBottom: 3,
        backgroundColor: '#337AB7', border: '1px solid', borderColor: '#2e6da4', borderRadius: 2
    };
    
    return (
        <tr>
            <td style={{ width: '100%', whiteSpace: 'nowrap' }}>
                └ <a style={docStyle} onClick={() => { dispatch(selectDocument(id)) }}>
                    {documents.find(d => d.id === id).name}
                </a>
            </td>
            <td>
                <button className="btn btn-default btn-xs" onClick={() => dispatch(operationRemoveDocument(op.id, isTab, id))}>
                    <i className="fa fa-trash" />
                </button>
            </td>
            <td style={{ paddingLeft: 15 }} />
        </tr>
    );
}

const tabFields = [
	{ name: 'tabDepth', label: 'Tab Depth', units: 'mm', input: NumberInput, ...checkGE0 },
];

const groupFields = (ofields) => {
    let groups = { '_default': { visible: true, collapsible: false, fields: [] } };
    let fields = ofields.slice();

    Object.entries(OPERATION_GROUPS).forEach(entry => {
        let [key, group] = entry;
        if (!groups.hasOwnProperty(key)) {
            groups[key] = Object.assign({}, group)
            groups[key].fields = []
        }
        group.fields.forEach(field => {
            let index = fields.indexOf(field);
            if (index > -1)
                groups[key].fields.push(fields.splice(index, 1).pop())

        })
    })

    groups['_default'].fields = fields

    return groups;
}

const traverseDocumentTypes = (ids, documents) => {
    let result = { images: 0, vectors: 0, other: 0 };
    ids.forEach((id) => {
        let item = documents.find((item) => item.id == id)
        if (item) {
            if (item.dataURL) {
                result.images++
            } else if (item.rawPaths) {
                result.vectors++
            } else {
                result.other++
            }

            if (item.children.length) {
                let { images, vectors, other } = traverseDocumentTypes(item.children, documents)
                result.images += images;
                result.vectors += vectors;
                result.other += other;
            }
        }
    })
    return result;
}

class Operation extends React.Component {

    UNSAFE_componentWillMount() {
        this.setType = e => this.props.dispatch(setOperationAttrs({ type: e.target.value }, this.props.op.id));
        this.setTypeString = e => this.props.dispatch(setOperationAttrs({ type: e }, this.props.op.id));
        this.toggleExpanded = e => this.props.dispatch(setOperationAttrs({ expanded: !this.props.op.expanded }, this.props.op.id));
        this.toggleEnabled = e => this.props.dispatch(setOperationAttrs({ enabled: !this.props.op.enabled }, this.props.op.id));
        this.remove = e => this.props.dispatch(removeOperation(this.props.op.id));
        this.moveUp = e => this.props.dispatch(moveOperation(this.props.op.id, -1));
        this.moveDn = e => this.props.dispatch(moveOperation(this.props.op.id, +1));
        this.preset = (type, attrs) => this.props.dispatch(setOperationAttrs({ ...attrs,type: type }, this.props.op.id))
        this.toggleDocs = e => this.props.dispatch(setOperationAttrs({ _docs_visible: !this.props.op._docs_visible }, this.props.op.id));

        this.documentsCount = null;
        this.documentTypes = { vectors: 0, images: 0 };
        this.availableOps = Object.keys(OPERATION_TYPES);
        this.operationGroups = groupFields(OPERATION_TYPES[this.props.op.type].fields)
    }

    UNSAFE_componentWillReceiveProps(nextProps) {

        if (nextProps.op.documents.length !== this.documentsCount) {
            this.documentsCount = nextProps.op.documents.length
            this.documentTypes = traverseDocumentTypes(nextProps.op.documents, nextProps.documents)
            this.availableOps = Object.keys(OPERATION_TYPES);
            if (nextProps.op.documents.length) {
                if (!this.documentTypes.vectors) this.availableOps = this.availableOps.filter(item => item.match(/Raster/gi))
                if (!this.documentTypes.images) this.availableOps = this.availableOps.filter(item => !item.match(/^Laser Raster$/gi))

                if (!this.availableOps.includes(nextProps.op.type))
                    this.setTypeString(this.availableOps[0])
            }
        }

        if (nextProps.op.type != this.props.op.type) {
            this.operationGroups = groupFields(OPERATION_TYPES[nextProps.op.type].fields)
        }
    }

    render() {
        let { op, documents, selected, bounds, dispatch, fillColors, strokeColors, settings } = this.props;
        let error;
        if (!op.expanded) {
            for (let fieldName of OPERATION_TYPES[op.type].fields) {
                let field = OPERATION_FIELDS[fieldName];
                if (field.check && !field.check(op[fieldName], settings, op) && (!field.condition || field.condition(op, settings))) {
                    error = <Error operationsBounds={bounds} message="Expand to setup operation" />;
                    break;
                }
            }
        }

        let leftStyle;
        if (selected)
            leftStyle = { display: 'table-cell', borderLeft: '4px solid blue', borderRight: '4px solid transparent' };
        else
            leftStyle = { display: 'table-cell', borderLeft: '4px solid transparent', borderRight: '4px solid transparent' };

        let header;

        if (op.name && op.name.length)
            header = (<h5 style={{ marginTop: 0 }} onClick={this.toggleExpanded}>{op.name}</h5>)

        let rows = [
            <GetBounds Type="div" key="header" style={{ display: 'table-row' }} data-operation-id={op.id}>
                <div style={leftStyle} />
                <div style={{ display: 'table-cell', cursor: 'pointer' }}>
                    <i onClick={this.toggleExpanded}
                        className={op.expanded ? 'fa fa-fw fa-minus-circle' : 'fa fa-fw fa-plus-circle'} />
                </div>

                <div style={{ display: 'table-cell', width: '100%' }}>
                    {header}
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>

                        <div style={{ whiteSpace: 'nowrap' }}>
                            <select className="input-xs" value={op.type} onChange={this.setType}>{Object.keys(OPERATION_TYPES).map(type => <option key={type} disabled={!this.availableOps.includes(type)}>{type}</option>)}</select>
                            <MaterialPickerButton className="btn btn-success btn-xs" onApplyPreset={this.preset} operation={op} types={this.availableOps}><i className="fa fa-magic"></i></MaterialPickerButton>
                            <MaterialSaveButton className="btn btn-success btn-xs" onApplyPreset={this.preset} operation={op} types={this.availableOps}><i className="fa fa-floppy-o"></i></MaterialSaveButton>
                        </div>
                        <div className="btn-group">
                            <button className={"btn btn-warning btn-xs " + (op.enabled ? '' : 'btn-off')} onClick={this.toggleEnabled} title="Enable/Disable operation"><i className="fa fa-power-off"></i></button>
                            <button className="btn btn-default btn-xs " onClick={this.moveUp}><i className="fa fa-arrow-up"></i></button>
                            <button className="btn btn-default btn-xs" onClick={this.moveDn}><i className="fa fa-arrow-down"></i></button>
                            <button className="btn btn-danger btn-xs" onClick={this.remove}><i className="fa fa-times"></i></button>
                        </div>
                    </span>
                    {error}
                </div>
            </GetBounds>
        ];
        if (op.expanded) {
            if (!OPERATION_TYPES[op.type].skipDocs) {
                rows.push(
                    <div key="docs" style={{ display: 'table-row' }} data-operation-id={op.id}>
                        <div style={leftStyle} />
                        <div style={{ display: 'table-cell' }} />
                        <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                            <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                                <thead>
                                    <tr><td colSpan='3'><center><small>Drag additional Document(s) here</small></center></td></tr>
                                </thead>
                                <tbody style={{ display: op._docs_visible ? 'block' : 'none' }}>
                                    {op.documents.map(id => {
                                        return <Doc key={id} op={op} documents={documents} id={id} isTab={false} dispatch={dispatch} />
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr><td colSpan='3' style={{ textAlign: 'right' }}><a onClick={this.toggleDocs}><small>{op._docs_visible ? 'Hide Docs' : 'Show Docs (' + op.documents.length + ')'}</small></a></td></tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
            } else {
                rows.push(
                    <div key="nodocs" style={{ display: 'table-row' }}>
                      <div style={leftStyle} />
                      <div style={{ display: 'table-cell' }} />
                      <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                          <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                              <thead>
                                  <tr><td colSpan='3'><center><small>This operation does not use a Document source</small></center></td></tr>
                              </thead>
                          </table>
                      </div>
                    </div>
                );
            }

            rows.push(
                <div key="attrs" style={{ display: 'table-row' }}>
                    <div style={leftStyle} />
                    <div style={{ display: 'table-cell' }} />
                    <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                        <table>
                            <tbody>
                                {Object.entries(this.operationGroups || {}).map((entry) => {
                                    let [key, group] = entry;
                                    let fields = group.fields
                                        .filter(fieldName => { let f = OPERATION_FIELDS[fieldName]; return f && (!f.condition || f.condition(op, settings)); })
                                        .map(fieldName => {
                                            return <Field
                                                key={fieldName} op={op} field={OPERATION_FIELDS[fieldName]} selected={selected}
                                                fillColors={fillColors} strokeColors={strokeColors} settings={settings}
                                                operationsBounds={bounds} setAttrs={setOperationAttrs} dispatch={dispatch} />
                                        })
                                    if (key !== '_default' && group.fields.length) {
                                        if (group.collapsible) {
                                            return <tr key={key}><td><Details className="operationGroup" handler={(<h4>{key}</h4>)}><table><tbody>{fields}</tbody></table> </Details></td></tr>
                                        } else {
                                            return <tr key={key}><td><h4>{key}</h4><table><tbody>{fields}</tbody></table></td></tr>
                                        }
                                    } else {
                                        return <tr key={key}><td><table><tbody>{fields}</tbody></table></td></tr>
                                    }

                                })}
                            </tbody>
                        </table>
                    </div>
                </div>,
            );
            if (OPERATION_TYPES[op.type].allowTabs) {
                rows.push(
                    <div key="space" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                        <div style={leftStyle} />
                        <div style={{ display: 'table-cell' }}>&nbsp;</div>
                    </div>
                );
                if (op.tabDocuments.length) {
                    rows.push(
                        <div key="tabLabel" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell' }}><b>Tabs</b></div>
                        </div>,
                        <div key="tabDocs" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                <table style={{ width: '100%', border: '2px dashed #ccc' }}>
                                    <tbody>
                                        {op.tabDocuments.map(id => {
                                            return <Doc key={id} op={op} documents={documents} id={id} isTab={true} dispatch={dispatch} />
                                        })}
                                        <tr><td colSpan='3'><center><small>Drag additional Document(s) here</small></center></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>,
                    );
                    if (OPERATION_TYPES[op.type].tabFields) {
                        rows.push(
                            <div key="tabattrs" style={{ display: 'table-row' }}>
                                <div style={leftStyle} />
                                <div style={{ display: 'table-cell' }} />
                                <div style={{ display: 'table-cell', whiteSpace: 'normal' }}>
                                    <table>
                                        <tbody>
                                            {tabFields.map(field => {
                                                return <Field key={field.name} op={op} field={field} selected={selected} operationsBounds={bounds} setAttrs={setOperationAttrs} dispatch={dispatch} />
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    }
                }
                else {
                    rows.push(
                        <div key="tabLabel" style={{ display: 'table-row' }} data-operation-id={op.id} data-operation-tabs={true}>
                            <div style={leftStyle} />
                            <div style={{ display: 'table-cell' }} />
                            <div style={{ display: 'table-cell', border: '2px dashed #ccc' }}><b>Drag document(s) here to create tabs</b></div>
                        </div>,
                    );
                }
            } // types[op.type].allowTabs
        } // op.expanded

        return <div className={"operation-row " + (op.enabled ? "" : "disabled")} >{rows}</div>;
    }
} // Operation

export function Operations({ style }) {
    let operations = useSelector((state) => state.operations);
    let currentOperation = useSelector((state) => state.currentOperation);
    let documents = useSelector((state) => state.documents);
    let settings = useSelector((state) => state.settings);
    let dispatch = useDispatch();

    let [ boundsRef, bounds ] = useBounds();
    let [ operationsBoundsRef, operationsBounds ] = useBounds();

    let fillColors = [];
    let strokeColors = [];
    let addColor = (colors, color) => {
        let value = JSON.stringify(color);
        if (!colors.find(c => c.value === value)) {
            colors.push({ value: value, color: color });
        }
    }
    for (let doc of documents) {
        if (doc.rawPaths) {
            if (hasClosedRawPaths(doc.rawPaths)) {
                addColor(fillColors, doc.fillColor);
            }

            addColor(strokeColors, doc.strokeColor);
        }
    }
    for (let op of operations) {
        if (op.filterFillColor) {
            addColor(fillColors, op.filterFillColor);
        }

        if (op.filterStrokeColor) {
            addColor(strokeColors, op.filterStrokeColor);
        }
    }
    
    return (
        <div ref={boundsRef} style={style}>
            <div style={{ backgroundColor: '#eee', padding: '8px 16px', border: '3px dashed #ccc', marginBottom: 5 }} data-operation-id="new">
                <span style={{ paddingRight: '1em' }} className="fa fa-fw fa-plus"></span>
                <b>Drag documents here from the list above</b>
                <NoOperationsError operationsBounds={bounds} documents={documents} operations={operations} />
            </div>
            <OperationToolbar />
            <div ref={operationsBoundsRef} className="operations" style={{ height: "100%", overflowY: "auto" }} >
                {operations.map(o =>
                    <Operation
                        key={o.id} op={o} selected={currentOperation === o.id} documents={documents}
                        fillColors={fillColors} strokeColors={strokeColors} settings={settings}
                        dispatch={dispatch} bounds={operationsBounds} />
                )}
            </div>
        </div >
    );
}

class OperationToolbar extends React.Component {

    constructor(props) {
        super(props);
        this.handleAddSingle.bind(this)
        this.handleAddMultiple.bind(this)
        this.handleClearAll.bind(this)
    }

    handleAddSingle() {
        this.props.createSingle(selectedDocuments(this.props.documents));
    }

    handleAddMultiple() {
        this.props.createMultiple(selectedDocuments(this.props.documents));
    }

    handleClearAll() {
        this.props.clearAll();
    }

    render() {
        let hasSelected = this.props.documents.some((item) => item.selected)
        let settings = this.props.settings;
        return <ButtonToolbar style={{ paddingBottom: "5px", marginBottom: "5px", borderBottom: "1px solid #eee" }}>
            <Button disabled={!hasSelected && !settings.toolCreateEmptyOps} onClick={(e) => { this.handleAddSingle() }} bsSize="xsmall" bsStyle="info" title="Create a single operation with the selected documents"><Icon name="object-group" /> Create Single </Button>
            <Button disabled={!hasSelected} onClick={(e) => { this.handleAddMultiple() }} bsSize="xsmall" bsStyle="info" title="Create operations with each of the selected documents"><Icon name="object-ungroup" /> Create Multiple </Button>
            <Button disabled={!this.props.operations.length} onClick={e => this.handleClearAll()} bsStyle="danger" bsSize="xsmall" title="Clear all operations" >Clear All</Button>
        </ButtonToolbar>
    }
}

OperationToolbar = connect(
    (state) => { return { documents: state.documents, operations: state.operations, settings: state.settings } },
    (dispatch) => {
        return {
            createSingle: (documents) => { dispatch(addOperation({ documents })) },
            createMultiple: (documents) => { documents.forEach((doc) => { dispatch(addOperation({ documents: [doc] })) }) },
            clearAll: () => {
                confirm("Are you sure?", (data) => {
                    if (data) dispatch(clearOperations());
                })
            }
        }
    }
)(OperationToolbar);
