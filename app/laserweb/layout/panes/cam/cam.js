import React from 'react';
import uuid from 'node-uuid';
import {connect} from 'react-redux';

// TODO: vscode's syntax highlighter and autoformatter crap out in some 
//       cases; until this is fixed:
//          * In some spots I have to use function instead of =>
//          * In some spots I have to use Object.assign() instead of object spread
//          * I can't use @connect(...) notation; instead I use
//            y = connect(...)(y)

////////////////////////////////////////////////////////////////////////////////
// Action creator creators
//
// TODO: These should be moved to a separate module
// TODO: There's probably an existing library which does this
////////////////////////////////////////////////////////////////////////////////

// Set attributes on an object. 
// id is ignored for objects which don't have an id
export const setAttrs = objectType => {
    let type = objectType.toUpperCase() + '_SET_ATTRS';
    return (attrs, id) => ({ type, id, attrs });
};

// Add an object to an array. attrs is optional.
export const add = objectType => {
    let type = objectType.toUpperCase() + '_ADD';
    return (attrs) => ({ type, attrs: {...attrs, id: uuid.v4() } });
};

// Remove an object from an array.
export const remove = objectType => {
    let type = objectType.toUpperCase() + '_REMOVE';
    return (id) => ({ type, id });
};

// Add a child to a parent. attrs is optional.
export const addChild = objectType => {
    let type = objectType.toUpperCase() + '_ADD_CHILD';
    return (parentId, attrs) => ({ type, parentId, attrs: {...attrs, id: uuid.v4() } });
};

////////////////////////////////////////////////////////////////////////////////
// Reducer creators
//
// TODO: These should be moved to a separate module
// TODO: There's probably an existing library which does this
////////////////////////////////////////////////////////////////////////////////

// Does nothing, except return defaultValue if needed
export const reduceObject = defaultValue => (state = defaultValue) => state;

// Actions:
//      add:        returns a new object with attrs set
//      addChild:   returns a new object with attrs set
//      setAttrs:   sets attrs
export const reduceSetAttrs = (objectType, reducer) => {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let setAttrs = objectType.toUpperCase() + '_SET_ATTRS';
    return (state, action) => {
        if (action.type === add || action.type === addChild)
            return Object.assign({}, reducer(undefined, action), action.attrs);
        else if (action.type === setAttrs)
            return Object.assign({}, state, action.attrs);
        else
            return reducer(state, action);
    };
};

// Actions:
//      add:        returns a new object with attrs set
//      addChild:   returns a new object with attrs set
//      setAttrs:   sets attrs, but only if action.id === state.id
// reducer should be reduceSetAttrsWithId(objectType, ...)
export const reduceSetAttrsWithId = (objectType, reducer) => {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let setAttrs = objectType.toUpperCase() + '_SET_ATTRS';
    return (state, action) => {
        if (action.type === add || action.type === addChild)
            return Object.assign({}, reducer(undefined, action), action.attrs);
        else if (action.type === setAttrs && action.id === state.id)
            return Object.assign({}, state, action.attrs);
        else
            return reducer(state, action);
    };
};

// Actions:
//      add:        adds a new object to array and sets attrs
//      remove:     removes object from array
// reducer should be reduceSetAttrsWithId(objectType, ...)
export const reduceObjectArray = (objectType, reducer) => {
    let add = objectType.toUpperCase() + '_ADD';
    let remove = objectType.toUpperCase() + '_REMOVE';
    return (state = [], action) => {
        switch (action.type) {
            case add:
                return [...state, reducer(undefined, action)];
            case remove:
                return state.filter(o => o.id !== action.id);
            default:
                return state.map(o => reducer(o, action));
        }
    };
};

// A forest (a tree with multiple roots) looks like this.
// [
//     {
//         id: 'uuid-for-root-1',
//         children: ['uuid-for-child', ...],
//         more attrs...
//     },
//     {
//         id: 'uuid-for-child',
//         children: ['uuid-for-grandchild', ...],
//         more attrs...
//     },
//     {
//         id: 'uuid-for-grandchild',
//         children: [...],
//         more attrs...
//     },
// ]

// Actions:
//      add:        adds a new object to array and sets attrs. Use this to add roots.
//      addChild:   adds a new object to array and sets attrs. Also adds it to parent.
//      remove:     removes object from array. Also removes it from any parents.
// reducer should be reduceSetAttrsWithId(objectType, ...)
export const reduceForest = (objectType, reducer) => {
    let add = objectType.toUpperCase() + '_ADD';
    let addChild = objectType.toUpperCase() + '_ADD_CHILD';
    let remove = objectType.toUpperCase() + '_REMOVE';
    return (state = [], action) => {
        switch (action.type) {
            case add:
                return [...state, reducer(undefined, action)];
            case addChild:
                return [
                    ...state.map(o => {
                        if (o.id === action.parentId)
                            return Object.assign({}, o, { children: [...o.children, action.attrs.id] });
                        else
                            return o;
                    }),
                    reducer(undefined, action)];
            case remove:
                return state
                    .filter(o => o.id !== action.id)
                    .map(parent =>
                        Object.assign({}, parent, {
                            children: parent.children.filter(
                                childId => childId !== action.id)
                        }));
            default:
                return state.map(o => reducer(o, action));
        }
    };
};

////////////////////////////////////////////////////////////////////////////////
// forest components
//
// TODO: These should be moved to a separate module
////////////////////////////////////////////////////////////////////////////////

// Render a subtree of a forest
// * objects:   objects in forest
// * object:    root
// * Label:     component which generates a label for an object (props.object contains object to render)
// * Right:     component which generates right-hand side for an object (props.object contains object to render)
// * rowNumber: tracks current row across multiple calls for alternating line colors
// * indent:    current indention level
export const Tree = ({objects, object, Label = ({object}) => <span>Need a label</span>, Right = ({object}) => <span/>, rowNumber = { value: 0 }, indent = 0}) => {
    return (
        <div>
            <div style={{
                backgroundColor: ((rowNumber.value)++ & 1) ? 'cyan' : 'LightCyan',
            }}>
                <span style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginLeft: indent,
                }}>
                    <Label object={object}/>
                    <Right object={object}/>
                </span>
            </div>
            <div>
                {object.children.map(childId => {
                    let child = objects.find(child => child.id == childId);
                    return (
                        <Tree  key={childId}  {...{ objects, object: child, Label, Right, rowNumber, indent: indent + 30 }}/>
                    )
                }) }
            </div>
        </div>
    )
};

////////////////////////////////////////////////////////////////////////////////
// document actions and reducers
//
// TODO: These should be moved to a separate module
////////////////////////////////////////////////////////////////////////////////

const setDocumentAttrs = setAttrs('document');
const addDocument = add('document');
const addDocumentChild = addChild('document');
const removeDocument = remove('document');

export const DocumentType = {
    document: 'document',
    layer: 'layer',
    path: 'path',
};

const document =
    reduceSetAttrsWithId('document',
        reduceObject({
            type: DocumentType.document,
            name: '',
            children: [],
        }));
export const documents = reduceForest('document', document);

export const documentsWithSampleData = (state, action) => {
    if (state === undefined) {
        state = documents(state, {});
        let doc1 = addDocument({ name: 'dummy1.svg' });
        let doc2 = addDocument({ name: 'dummy2.svg' });
        let doc2Layer1 = addDocumentChild(doc2.attrs.id, { name: 'layer1', type: DocumentType.layer });
        let doc2Layer2 = addDocumentChild(doc2.attrs.id, { name: 'layer2', type: DocumentType.layer });
        let doc3 = addDocument({ name: 'dummy3.svg' });
        state = documents(state, doc1);
        state = documents(state, doc2);
        state = documents(state, doc2Layer1);
        state = documents(state, doc2Layer2);
        state = documents(state, doc3);
        state = documents(state, addDocumentChild(doc1.attrs.id, { name: 'path1', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc1.attrs.id, { name: 'path2', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc1.attrs.id, { name: 'rect3', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer1.attrs.id, { name: 'path1', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer1.attrs.id, { name: 'path2', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer1.attrs.id, { name: 'rect3', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer2.attrs.id, { name: 'path4', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer2.attrs.id, { name: 'path5', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc2Layer2.attrs.id, { name: 'rect6', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc3.attrs.id, { name: 'path1', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc3.attrs.id, { name: 'path2', type: DocumentType.path }));
        state = documents(state, addDocumentChild(doc3.attrs.id, { name: 'rect3', type: DocumentType.path }));
    }
    return documents(state, action);
};

////////////////////////////////////////////////////////////////////////////////
// cam actions and reducers
////////////////////////////////////////////////////////////////////////////////

const setOperationAttrs = setAttrs('operation');
const addOperation = add('operation');
const removeOperation = remove('operation');

const operation =
    reduceSetAttrsWithId('operation',
        reduceObject({
            camToolDia: 6.35,
            camZClearance: 10,
            camDragOffset: 0.1,
            camVDia: 10,
            camVHeight: 10,
            camVAngle: 90,
            camLaserPower: 100,
            camLaserDiameter: 0.1,
            camZStep: 5,
            camZDepth: 25,
            camFeedrate: 6,
            camPlungerate: 2,
        }));
export const operations = reduceObjectArray('operation', operation);

export const cam = (state = {}, action) => {
    return {
        operations: operations(state.operations, action),
        documents: documentsWithSampleData(state.documents, action),    // TODO: move this to top level store
    };
}

////////////////////////////////////////////////////////////////////////////////
// cam components
////////////////////////////////////////////////////////////////////////////////

function NumberField({object, field, description, units, setAttrs, dispatch, ...rest}) {
    return (
        <div className="input-group">
            <span className="input-group-addon">{description}</span>
            <input
                type="number"
                value={object[field]}
                onChange={e => dispatch(setAttrs({ [field]: Number(e.target.value) }, object.id)) }
                {...rest}
                />
            <span className="input-group-addon">{units}</span>
        </div>
    );
}
NumberField = connect()(NumberField);

let DocumentLabel = ({object}) => (
    <span>
        {object.name}
    </span>
);

let DocumentRight = ({object, dispatch}) => (
    <button
        className="btn btn-danger btn-xs"
        onClick={e => dispatch(removeDocument(object.id)) }>
        <i className="fa fa-times"></i>
    </button>
);
DocumentRight = connect()(DocumentRight);

function Documents({documents}) {
    let rowNumber = { value: 0 };
    return (
        <div>
            {documents
                .filter(document => document.type === DocumentType.document)
                .map(document => (
                    <Tree
                        key={document.id} objects={documents} object={document}
                        Label={DocumentLabel} Right={DocumentRight} rowNumber={rowNumber}/>
                )) }
        </div>
    );
}

function Operation({op, dispatch}) {
    return (
        <div>
            <div className="form-group">
                <label className="control-label">Tool Options
                    <button onClick={e => dispatch(removeOperation(op.id)) }>Remove Operation</button>
                </label>
                <NumberField field="camToolDia"       units="mm"   description="Endmill Diameter"          step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camZClearance"    units="mm"   description="Z Safe Height"             step="any" min="1"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camDragOffset"    units="mm"   description="Drag Knife: Center Offset" step="0.1" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVDia"          units="mm"   description="V Bit: Diameter"           step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVHeight"       units="mm"   description="V Bit: Height"             step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camVAngle"        units="deg"  description="V Bit: V Angle"            step="any" min="0"             object={op} setAttrs={setOperationAttrs} className="form-control input-sm"/>
                <NumberField field="camLaserPower"    units="%"    description="Laser: Power"              step="any" min="1"   max="100" object={op} setAttrs={setOperationAttrs} className="form-control"/>
                <NumberField field="camLaserDiameter" units="mm"   description="Laser: Diameter"           step="0.1" min="0.1" max="5"   object={op} setAttrs={setOperationAttrs} className="form-control"/>
            </div>

            <div className="form-group inputcnc inputlaser">
                <label>Operation Depth</label>
                <NumberField field="camZStep"         units="mm"   description="Cut Depth per pass"        step="1"   min="0"             object={op} setAttrs={setOperationAttrs} className="form-control"/>
                <NumberField field="camZDepth"        units="mm"   description="Cut Depth Final"           step="1"   min="0"             object={op} setAttrs={setOperationAttrs} className="form-control"/>
            </div>

            <div className="form-group">
                <label>Feedrate</label>
                <NumberField field="camFeedrate"      units="mm/s" description="Feedrate: Cut"             step="1"   min="0"             object={op} setAttrs={setOperationAttrs} className="form-control"/>
                <NumberField field="camPlungerate"    units="mm/s" description="Feedrate: Plunge"          step="1"   min="0"             object={op} setAttrs={setOperationAttrs} className="form-control"/>
            </div>
        </div>
    );
}
Operation = connect()(Operation);

export function Cam({cam, dispatch}) {
    return (
        <div>
            <b>Documents</b>
            <Documents documents={cam.documents}/>
            <br/><br/><b>Operations</b>
            <button onClick={e => dispatch(addOperation()) }>Add Operation</button>
            {cam.operations.map(op => <Operation key={op.id} op={op}/>) }
        </div>);
}
Cam = connect()(Cam);

////////////////////////////////////////////////////////////////////////////////
// Hook up to rest of system; this will probably go away when entire system is
// react+redux.
////////////////////////////////////////////////////////////////////////////////

export function initCam(lw, cb) {
    lw.add_module('layout.panes.cam', {
        autoload: true,
        version: '0.0.1',
        title: 'CAM',
        icon: 'pencil-square-o',
        extends: ['layout.pane'],
        init: function () {
            this.add_dock();
            this.add_pane();
            cb(this.$.pane.get(0));
        }
    });
}
