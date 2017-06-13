import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';
import Rnd from 'react-rnd';
import { canvasFilters } from '../lib/lw.raster2gcode/canvas-filters';
import { OPERATION_GROUPS } from './operation';
import { getSubset } from 'redux-localstorage-filter';

import { Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse, InputGroup } from 'react-bootstrap'
import Toggle from "react-toggle";
import { Input } from './forms'
import Potrace from '../lib/potrace/potrace'
import { loadDocument, setDocumentAttrs } from '../actions/document';

import Parser from '../lib/lw.svg-parser/parser';

import { sendAsFile } from '../lib/helpers'

export const promisedImage = (path) => {
    return new Promise(resolve => {
        let img = new Image();
        img.onload = () => {
            resolve(img)
        }
        img.src = path;
    })
}

export const imageTagPromise = (tags) => {
    return new Promise(resolve => {
        let images = [];
        const walker = (tag) => {
            if (tag.name === 'image')
                images.push(tag);
            if (tag.children)
                tag.children.forEach(t => walker(t))
        }

        const consumer = () => {
            if (images.length) {
                let tag = images.shift()
                let dataURL = tag.element.getAttribute('xlink:href')
                if (dataURL.substring(0, 5) !== 'data:')
                    return consumer();
                let image = new Image();
                image.onload = () => { tag.naturalWidth = image.naturalWidth; tag.naturalHeight = image.naturalHeight; consumer() }
                image.src = dataURL;
            } else {
                resolve(tags);
            }
        }

        walker(tags);
        consumer();
    })
}

export class ImagePort extends React.Component {

    constructor(props)
    {
        super(props)
        this.filters = {}
        this.timeout=0;
    }

    componentDidMount()
    {
        this.enable(false);
    }

    componentDidUpdate(prevProps) {
        this.enable(this.props.enabled && this.processImage());
    }

    componentWillUnmount()
    {
        this.enable(false);
    }

    processImage() {

        let ops = this.props.data.operations.find((op) => ((op.id === this.props.data.currentOperation) && op.type.match(/Raster/gi)));

        if (!ops) 
            return false;
        
        let documents = this.props.data.documents
            .filter(d => (ops.documents.includes(d.id)))
            .filter(d => (d.selected))

        let filters = getSubset(ops, OPERATION_GROUPS.Filters.fields)

        if (JSON.stringify(filters) !== JSON.stringify(this.filters)) {
            clearTimeout(this.timeout)
            this.timeout=setTimeout(function(){
                this.filters = filters;
                if (documents.length) {
                    promisedImage(documents[0].dataURL).then((image) => {
                        this.canvas.width = image.width;
                        this.canvas.height = image.height;
                        this.canvas.getContext("2d").drawImage(image, 0, 0)
                        canvasFilters(this.canvas, filters)
                    })
                }
            }.bind(this),200)
        }

        return documents.length;
    }

    enable(b) {
        let selfNode = ReactDOM.findDOMNode(this);
        selfNode.style.pointerEvents = (b)? 'all': 'none';
        selfNode.style.display = (b)? 'block': 'none';

    }

    render() {

        let canvas = <canvas ref={c => { this.canvas = c }} className="ImagePort"/>;

        if (this.props.draggable) {
            return <Rnd ref={c => { this.rnd = c; }}
                initial={{
                    width: this.props.width || 320,
                    height: this.props.height || 240
                }}
                minWidth={160} minHeight={120}
                maxWidth={800} maxHeight={600}
                lockAspectRatio={true}
                bounds={this.props.draggable}
                zIndex={10001}>{canvas}</Rnd>
        } else {
            return <div>{canvas}</div>;
        }
    }
}

ImagePort = connect(state => ({
    data: {
        operations: state.operations,
        documents: state.documents,
        currentOperation: state.currentOperation
    }
}))(ImagePort)


function ImageEditorModal({ modal, className, header, footer, children, ...rest }) {

    return (
        <Modal show={modal.show} onHide={modal.onHide} bsSize="large" aria-labelledby="contained-modal-title-lg" className={className}>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-lg">{header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : undefined}

        </Modal>
    )

}

export class ImageEditorButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showModal: false }
        this.handleClick.bind(this)
        this.onModKey.bind(this)
        this.offModKey.bind(this)
        this.state = {}
        this.__mounted=false;
    }

    onModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
    }

    offModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
    }

    componentDidMount() {
        this.__mounted=true;
        document.addEventListener('keydown', this.onModKey.bind(this))
        document.addEventListener('keyup', this.offModKey.bind(this))
    }

    componentWillUnmount() {
        this.__mounted=false;
        document.removeEventListener('keydown', this.onModKey.bind(this))
        document.removeEventListener('keyup', this.offModKey.bind(this))
    }



    handleClick(e) {
        if (e.shiftKey) {
            e.preventDefault();
        } else {
            this.setState({ showModal: true })
        }
    }

    render() {
        let closeModal = () => this.setState({ showModal: false });
        let className = this.props.className;
        if (this.state.shiftKey) className += ' btn-warning'
        return (
            <Button bsStyle={this.props.bsStyle||'primary'} bsSize={this.props.bsSize || 'small'} className={className} onClick={(e) => this.handleClick(e)}>{this.props.children}
                <ImageEditor show={this.state.showModal} onHide={closeModal}  />
            </Button>
        )
    }
}

class ImageEditor extends React.Component
{
    constructor(props){
        super(props)
        this.state={
                turnpolicy: 'minority', // potrace
                turdsize: 2,            // potrace
                optcurve: true,         // potrace
                alphamax: 1,            // potrace
                opttolerance: 0.2,      // potrace
        }
        this.handleStateChange.bind(this)
        this.handleTrace.bind(this)
        this.handleNew.bind(this)
    }

    componentDidMount()
    {
        this.processImage();
    }

    componentDidUpdate()
    {
        this.processImage();
    }

    handleStateChange(change)
    {
        let state= Object.assign(this.state, change)
        this.setState(state)
    }

    handleTrace(e){
        let [width, height] = this.currentDocument.originalSize;
        let [wpx, hpx] = this.currentDocument.originalPixels;
        Potrace.loadImageFromUrl(this.image.src)
        Potrace.setParameter(this.state)
        Potrace.process(function(){

            this.svg=Potrace.getSVG(1).replace(/width="([^\"]+)" height="([^\"]+)"/gi, (str,w,h)=>{ 
                return `width="${width.toFixed(3)}mm" height="${height.toFixed(3)}mm" viewBox="0 0 ${wpx} ${hpx}" `} 
            )
            let blob = new Blob([this.svg], {type: 'image/svg+xml;charset=utf-8'});
            let url = window.URL.createObjectURL(blob)
            this.trace.onload=function(){
                window.URL.revokeObjectURL(url);
            }
            this.trace.src=url;
        }.bind(this))
    }

    handleNew(e){
        let modifiers={};
        let doc = this.currentDocument
        let parser = new Parser({});
            parser.parse(this.svg)
                .then((tags) => {
                    imageTagPromise(tags).then((tags) => {
                        this.props.dispatch(loadDocument({name: `Traced ${doc.name}`, type:'image/svg+xml'}, { parser, tags }, modifiers));
                    })
                })
                .catch((e) => {
                    console.error(e)
                })
        
    }

    processImage()
    {
        if (!this.props.show) return false;

        let documents = this.props.data.documents
            .filter(d => (d.selected))

        if (documents.length)
        {
            this.currentDocument = documents[0]
            this.image.src=this.currentDocument.dataURL;
        }
    }

    render()
    {
        return <ImageEditorModal modal={{ show: this.props.show, onHide: this.props.onHide }}
                header="Image Editor"
            >
            <div>
                <img ref={(i)=>{this.image=i}} src="" style={{width:"50%"}}/>
                <img ref={(i)=>{this.trace=i}} src="" style={{width:"50%", height:"auto"}} className="checker"/>
            </div>
            <div>
                 <div>Turn Policy <Input Component={FormControl} type="text" onChangeValue={v => this.handleStateChange({'turnpolicy':v}) } value={this.state['turnpolicy']} /></div>
                 <div>Turd Size <Input Component={FormControl} type="number" onChangeValue={v => this.handleStateChange({'turdsize':v}) } value={this.state['turdsize']} /></div>
                 <div>Alpha Max <Input Component={FormControl} type="number" onChangeValue={v => this.handleStateChange({'alphamax':v}) } value={this.state['alphamax']} /></div>
                 <div>Opt Curve <Toggle id={"toggle_optcurve"} defaultChecked={this.state['optcurve'] == true} onChange={e => this.handleStateChange({'optcurve':e.target.checked })} /></div>
                 <div>Opt Tolerance <Input Component={FormControl} type="number" onChangeValue={v => this.handleStateChange({'opttolerance':v}) } value={this.state['opttolerance']} /></div>
                 <Button onClick={e=>this.handleTrace(e)}>Trace</Button>
                 <Button onClick={e=>this.handleNew(e)}>New Doc</Button>
            </div>
            </ImageEditorModal>
    }
}

ImageEditor = connect(state => ({
    data: {
        documents: state.documents,
        settings: state.settings
    }
}))(ImageEditor)