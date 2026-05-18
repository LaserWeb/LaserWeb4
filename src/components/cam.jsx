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

import { Helper as dxfHelper} from 'dxf';
import Parser from '../lib/lw.svg-parser/parser';
import React, { useCallback, useContext, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';

import { loadDocument, setDocumentAttrs, cloneDocumentSelected, selectDocuments, colorDocumentSelected, removeDocumentSelected, selectDocumentsByColor } from '../actions/document';

import { setGcode, generatingGcode } from '../actions/gcode';
import { resetWorkspace } from '../actions/laserweb';
import { Documents } from './document';
import { documentCacheContext } from './document-cache'
import { Operations, Error } from './operation';
import { OperationDiagram } from './operation/diagram';
import Splitter from './splitter';
import { getGcode } from '../lib/cam-gcode';
import { sendAsFile, appendExt, openDataWindow, captureConsole, humanFileSize } from '../lib/helpers';
import { strftime } from '../lib/strftime'
import { ValidateSettings } from '../reducers/settings';
import { ApplicationSnapshotToolbar } from './settings';

import { Button, ButtonToolbar, ButtonGroup, ProgressBar, Alert } from 'react-bootstrap'
import Icon from './font-awesome'
import { prompt, confirm } from './laserweb'

import CommandHistory from './command-history'
import { FileField, Info, ColorPicker, SearchButton } from './forms'

import { promisedImage, imageTagPromise } from './image-filters';

import convert from 'color-convert'
import useBounds from '../hooks/use-bounds';

export const DOCUMENT_FILETYPES = '.png,.jpg,.jpeg,.bmp,.gcode,.g,.svg,.dxf,.tap,.gc,.nc'

function NoDocumentsError({ settings, documents, operations, camBounds }) {
    let [ anchorRef, bounds ] = useBounds();

    if (documents.length === 0 && (operations.length === 0 || !settings.toolCreateEmptyOps)) {
        return <span ref={anchorRef}>
            <Error bounds={bounds} operationsBounds={camBounds} message='Click here to begin' />
        </span>;
    } else {
        return <span />;
    }
}

function GcodeProgress({ onStop }) {
    let gcoding = useSelector((state) => state.gcode.gcoding);

    return <div style={{ display: "flex", flexDirection: "row" }}>
        <ProgressBar now={gcoding.percent} active={gcoding.enable} label={`${gcoding.percent}%`} style={{ flexGrow: 1, marginBottom: "0px" }} />
        <Button onClick={onStop} bsSize="xs" bsStyle="danger"><Icon name="hand-paper-o" /></Button>
    </div>;
}

export function CAMValidator({ noneOnSuccess, className, style }) {
    let documents = useSelector((state) => state.documents.length);

    let errors = (!documents) ? "Add files to begin" : undefined
    if (noneOnSuccess && !errors) { return null; }
    
    return <span className={className} title={errors ?? "Good to go!"} style={style}>
        <Icon name={errors ? 'warning' : 'check'} />
    </span>;
}

let __interval;

export function Cam() {
    let dispatch = useDispatch();
    let settings = useSelector((state) => state.settings);
    let documents = useSelector((state) => state.documents);
    let operations = useSelector((state) => state.operations);
    let currentOperation = useSelector((state) => state.currentOperation);
    let gcode = useSelector((state) => state.gcode.content);
    let gcoding = useSelector((state) => state.gcode.gcoding);
    let dirty = useSelector((state) => state.gcode.dirty);
    let panes = useSelector((state) => state.panes);

    let documentCacheHolder = useContext(documentCacheContext);
    let [ boundsRef, bounds ] = useBounds();
    let generationRef = useRef();
    let [ filter, setFilter ] = React.useState();

    let saveGcode = useCallback((e) => {
        prompt('Save as', strftime(settings.gcodeFilename), (file) => {
            if (file !== null) {
                sendAsFile(appendExt(file, settings.gcodeExtension), gcode.content);
            }
        }, !e.shiftKey)
    }, [ settings, gcode ]);

    let viewGcode = useCallback((e) => {
        if (gcode.content.length < 1048576) {
            openDataWindow(gcode.content);
        } else {
            confirm("Size: " + humanFileSize(gcode.content.length) + ", viewing very large files can negatively affect browser performance. Are you sure?", (accepted) => {
                if (accepted) {
                    openDataWindow(gcode.content);
                }
            }, e.shiftKey)
        }
    }, [ gcode ]);

    let clearGcode = useCallback((e) => {
        confirm("This will delete the currently loaded Gcode. Are you sure?", (accepted) => {
            if (accepted) {
                dispatch(setGcode(""));
            }
        }, e.shiftKey);
    }, [ dispatch ]);
    
    let handleLoadDocument = useCallback((e, modifiers = {}) => {
        // TODO: report errors
        for (let file of e.target.files) {
            if (file.name.substr(-4) === '.svg') {
                loadSVG(file).then(({ parser, tags }) => dispatch(loadDocument(file, { parser, tags }, modifiers)));
            } else if (file.name.substr(-4).toLowerCase() === '.dxf') {
                loadDXF(file).then((dxfTree) => dispatch(loadDocument(file, dxfTree, modifiers)));
            } else if (file.type.substring(0, 6) === 'image/') {
                loadImage(file).then(([ url, image ]) => dispatch(loadDocument(file, url, modifiers, image)));
            } else if (file.name.match(/\.(nc|gc|gcode)$/gi)) {
                loadGcode(file).then((gcode) => dispatch(setGcode(gcode)));
            } else {
                loadDefault(file).then((url) => dispatch(loadDocument(file, url, modifiers)));
            }
        }
    }, [ dispatch ]);

    let toggleDocumentExpanded = useCallback((doc) => {
        dispatch(setDocumentAttrs({ expanded: !doc.expanded }, doc.id))
    }, [ dispatch ]);

    let loadGcodeDirectly = useCallback((e) => {
        // FIXME: Use loadGcode instead
        let reader = new FileReader;
        reader.onload = () => dispatch(setGcode(reader.result));
        reader.readAsText(e.target.files[0]);
    }, [ dispatch ]);

    let handleResetWorkspace = useCallback((_e) => {
        confirm("This will completely erase your workspace! Are you sure?", (data) => {
            if (data) {
                dispatch(resetWorkspace());
            }
        })
    }, [ dispatch ]);

    let generateGcode = useCallback((_e) => {
        let percent = 0;
        __interval = setInterval(() => {
            dispatch(generatingGcode(true, isNaN(percent) ? 0 : Number(percent)));
        }, 100)

        generationRef.current = getGcode(settings, documents, operations, documentCacheHolder,
            (msg, level) => { CommandHistory.write(msg, level); },
            (gcode) => {
                clearInterval(__interval)
                dispatch(generatingGcode(false))
                dispatch(setGcode(gcode));
            },
            (threads) => {
                percent = ((Array.isArray(threads)) ? (threads.reduce((a, b) => a + b, 0) / threads.length) : threads).toFixed(2);
            }
        );
    }, [ dispatch, documents, operations, settings, documentCacheHolder ]);

    let stopGcode = useCallback((_e) => {
        if (generationRef.current != null) {
            generationRef.current.end();
            generationRef.current = null;
        }
    }, []);

    // FIXME: memoize the below?
    let validator = ValidateSettings(false)
    let valid = validator.passes();
    let someSelected=documents.some((i)=>(i.selected));

    return (
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="panel panel-danger" style={{ marginBottom: 0 }}>
                <div className="panel-heading" style={{ padding: 2 }}>
                    <table style={{ width: 100 + '%' }}>
                        <tbody>
                            <tr>
                                <td>
                                    <label>Workspace</label>
                                </td>
                                <td>
                                    <ApplicationSnapshotToolbar loadButton saveButton stateKeys={['documents', 'operations', 'currentOperation', 'settings.toolFeedUnits']} saveName={strftime(settings.workspaceFilename + '.json')} label="Workspace" className="well well-sm">
                                        <Button bsSize="xsmall" bsStyle="warning" onClick={e => handleResetWorkspace(e)}>Reset <Icon name="trash" /></Button>
                                    </ApplicationSnapshotToolbar>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="Resizer horizontal" style={{ marginTop: '2px', marginBottom: '2px' }}></div>
            <div ref={boundsRef} className="panel panel-info" style={{ marginBottom: 3 }}>
                <div className="panel-heading" style={{ padding: 2 }}>
                    <table style={{ width: 100 + '%' }}>
                        <tbody>
                            <tr>
                                <td>
                                    <label>Documents {Info(<small>Tip:  Hold <kbd>Ctrl</kbd> to click multiple documents</small>)}</label>
                                </td>
                                <td style={{display:"flex", justifyContent: "flex-end" }}>

                                    <FileField style={{   position: 'relative', cursor: 'pointer' }} onChange={handleLoadDocument} accept={DOCUMENT_FILETYPES}>
                                        <button title="Add a DXF/SVG/PNG/BMP/JPG document to the document tree" className="btn btn-xs btn-primary"><i className="fa fa-fw fa-folder-open" />Add Document</button>
                                        {(panes.visible) ? <NoDocumentsError camBounds={bounds} settings={settings} documents={documents} operations={operations} /> : undefined}
                                    </FileField>&nbsp;
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
            <Splitter style={{ flexShrink: 0 }} split="horizontal" initialSize={100} resizerStyle={{ marginTop: 2, marginBottom: 2 }} splitterId="cam-documents">
                <div style={{height:"100%", display:"flex", flexDirection:"column"}} >
                    <div style={{ overflowY: 'auto', flexGrow:1 }}><Documents documents={documents} filter={filter} toggleExpanded={toggleDocumentExpanded} /></div>
                    {documents.length ? <ButtonToolbar bsSize="xsmall" bsStyle="default">

                        <ButtonGroup>
                            <Button  bsStyle="info" bsSize="xsmall" onClick={()=>{dispatch(selectDocuments(true))}} title="Select all"><Icon name="cubes"/></Button>
                            <Button  bsStyle="default" bsSize="xsmall" onClick={()=>{dispatch(selectDocuments(false))}} title="Select none"><Icon name="cubes"/></Button>
                            <Button  bsStyle="success" bsSize="xsmall" disabled={!someSelected} onClick={e=>{dispatch(selectDocumentsByColor(e.shiftKey))}} title="Select all with matching path color(s), Press [SHIFT] to select by fill color"><Icon name="eyedropper"/></Button>
                        </ButtonGroup>
                        <Button  bsStyle="warning" bsSize="xsmall" disabled={!someSelected} onClick={()=>{dispatch(cloneDocumentSelected())}} title="Clone selected"><Icon name="copy"/></Button>
                        <Button  bsStyle="danger" bsSize="xsmall" disabled={!someSelected} onClick={()=>{dispatch(removeDocumentSelected())}} title="Remove selected"><Icon name="trash"/></Button>
                        <SearchButton bsStyle="primary" bsSize="xsmall" search={filter} onSearch={(filter) => setFilter(filter)} placement="bottom"><Icon name="search"/></SearchButton>
                        <ButtonGroup style={{ float: 'right' }}>
                            <ColorPicker to="rgba" icon="pencil" bsSize="xsmall" disabled={!someSelected} onClick={v=>dispatch(colorDocumentSelected({strokeColor:v||[0,0,0,1], strokeColorHex: convert.rgb.hex(v.slice(0, 3).map(x => x * 255))||"000000" }))}/>
                            <ColorPicker to="rgba" icon="paint-brush" bsSize="xsmall" disabled={!someSelected} onClick={v=>dispatch(colorDocumentSelected({fillColor:v||[0,0,0,0], fillColorHex: convert.rgb.hex(v.slice(0, 3).map(x => x * 255))||"000000" }))}/>
                        </ButtonGroup>
                        </ButtonToolbar>:undefined}
                </div>
            </Splitter>
            <Alert bsStyle="success" style={{ padding: "4px", marginBottom: 7 }}>
                <table style={{ width: 100 + '%' }}>
                    <tbody>
                        <tr>
                            <th>GCODE</th>
                            <td style={{ width: "80%", textAlign: "right" }}>{!gcoding.enable ? (
                                <ButtonToolbar style={{ float: "right" }}>
                                    <button title="Generate G-Code from Operations below" className={"btn btn-xs btn-attention " + (dirty ? 'btn-warning' : 'btn-primary')} disabled={!valid || gcoding.enable} onClick={(e) => generateGcode(e)}><i className="fa fa-fw fa-industry" />&nbsp;Generate</button>
                                    <ButtonGroup>
                                        <button title="View generated G-Code in a tab. Please disable popup blockers. Press [SHIFT] to avoid large file size confirmation and open in a new window." className="btn btn-info btn-xs" disabled={!valid || gcoding.enable} onClick={viewGcode}><i className="fa fa-eye" /></button>
                                        <button title="Export G-code to File. Press [SHIFT] to edit filename." className="btn btn-success btn-xs" disabled={!valid || gcoding.enable} onClick={saveGcode}><i className="fa fa-floppy-o" /></button>
                                        <FileField onChange={loadGcodeDirectly} disabled={!valid || gcoding.enable} accept=".gcode,.gc,.nc">
                                            <button title="Load G-Code from File" className="btn btn-danger btn-xs" disabled={!valid || gcoding.enable} ><i className="fa fa-folder-open" /></button>
                                        </FileField>
                                    </ButtonGroup>
                                    <button title="Clear Current Gcode. Press [SHIFT] to avoid confirmation." className="btn btn-warning btn-xs" disabled={!valid || gcoding.enable} onClick={clearGcode}><i className="fa fa-trash" /></button>
                                </ButtonToolbar>) : <GcodeProgress onStop={(e) => stopGcode(e)} />}</td>
                        </tr>
                    </tbody>
                </table>
            </Alert>
            <OperationDiagram {...{ operations, currentOperation }} />
            <Operations style={{ flexGrow: 2, display: "flex", flexDirection: "column" }} />
        </div>
    );
}

async function readWithReader(file, method) {
    let reader = new FileReader();

    return new Promise((resolve, _reject) => {
        reader.addEventListener("load", () => resolve(reader.result));
        reader[method](file);
    });
}

async function loadSVG(file) {
    let contents = await readWithReader(file, "readAsText");

    const release = captureConsole(); // TODO: Why is this necessary?
    let parser = new Parser({});
    
    try {
        let tags = await parser.parse(contents);
        let captures = release(true);
        let warns = captures.filter(i => i.method == 'warn');
        let errors = captures.filter(i => i.method == 'errors');

        if (warns.length) { CommandHistory.dir("The file has minor issues. Please check document is correctly loaded!", warns, 2); }
        if (errors.length) { CommandHistory.dir("The file has serious issues. If you think is not your fault, report to LW dev team attaching the file.", errors, 3); }

        await imageTagPromise(tags); // REFACTOR: Give this a clearer name
        return { parser, tags };
    } catch (error) {
        release(true);
        CommandHistory.dir("The file has serious issues. If you think is not your fault, report to LW dev team attaching the file.", String(error), 3);
        console.error(error);
    }
}

async function loadDXF(file) {
    let helper = new dxfHelper(await readWithReader(file, "readAsText"));
    let dxfTree = helper.toPolylines();
    return dxfTree;
}

async function loadImage(file) {
    let url = await readWithReader(file, "readAsDataURL");

    try {
        let image = await promisedImage(url);
        return [ url, image ];
    } catch (error) {
        console.log('error:', error);
    }
}

async function loadGcode(file) {
    return await readWithReader(file, "readAsText");
}

async function loadDefault(file) {
    return await readWithReader(file, "readAsDataURL");
}

// FIXME(REFACTOR): Duplicate export
export default Cam;
