import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';
import Rnd from 'react-rnd';
import { canvasFilters } from '../lib/lw.raster2gcode/canvas-filters';
import { OPERATION_GROUPS, OPERATION_FIELDS } from './operation';
import { getSubset } from 'redux-localstorage-filter';

import { Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse, InputGroup } from 'react-bootstrap'
import Toggle from "react-toggle";
import { Input } from './forms'
import Potrace from '../lib/potrace/potrace'
import { loadDocument, setDocumentAttrs } from '../actions/document';
import Icon from './font-awesome';

import Parser from '../lib/lw.svg-parser/parser';

import { sendAsFile } from '../lib/helpers'
import { confirm } from './laserweb'

import { mat2d } from 'gl-matrix'

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


function checkRange(min, max) {
    return {
        check: (v) => {
            if (isFinite(v)) {
                return v >= min && v <= max;
            } else if (isObject(v) && v.hasOwnProperty('min') && v.hasOwnProperty('max')) {
                return (v.min >= min && v.min <= max) && (v.max >= min && v.max <= max)
            }
        },
        error: 'Must be in range [' + min + ' , ' + max + ']',
    }
}

function EnumInput(opts, def) {
    if (Array.isArray(opts))
        opts = Object.assign( ...opts.map(i=>({[i]:i})) )
    
    return function({ op, field, onChangeValue, ...rest }){
        return <select value={op[field.name]}  onChange={e => onChangeValue(e.target.value)}>
            {Object.entries(opts).map((e, i)=>(<option key={i} value={e[0]}>{e[1]}</option>))}
        </select>
    }
}

function ToggleInput({ op, field, onChangeValue, fillColors, strokeColors, className = "scale75", ...rest }) {
    return <Toggle id={"toggle_" + field.name} defaultChecked={op[field.name]} onChange={e => onChangeValue(e.target.checked)} className={className} />
}

function NumberInput(props) {
    let { op, field, fillColors, strokeColors, ...rest } = props;
    return <Input type='number' step='any' value={op[field.name]}   {...rest } />;
}

function RangeInput(props) {
    return function({ op, field, onChangeValue, ...rest }){
        return <div className="rangeInput"><code>{op[field.name]}</code><input type='range' value={op[field.name]} onChange={e => onChangeValue(e.target.value)} {...{...props}}/></div>
    }
}

const ImageFilterControls={
    smoothing:      { name: 'smoothing', label: 'Smoothing',  input: ToggleInput },                                // lw.raster-to-gcode: Smoothing the input image ?
    brightness:     { name: 'brightness',label: 'Brightness',  input: RangeInput({min:-255, max:255}), ...checkRange(-255, 255) },   // lw.raster-to-gcode: Image brightness [-255 to +255]
    contrast:       { name: 'contrast', label: 'Contrast',  input: RangeInput({min:-255, max:255}), ...checkRange(-255, 255) },         // lw.raster-to-gcode: Image contrast [-255 to +255]
    gamma:          { name: 'gamma',label: 'Gamma', units: '', input: RangeInput({min:0, max:7.99}), ...checkRange(0, 7.99) },                    // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
    grayscale:      { name: 'grayscale',label: 'Grayscale', units: '', input: EnumInput(['none', 'average', 'luma', 'luma-601', 'luma-709', 'luma-240', 'desaturation', 'decomposition-min', 'decomposition-max', 'red-chanel', 'green-chanel', 'blue-chanel']) },                             // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
    shadesOfGray:   { name: 'shadesOfGray', label: 'Shades', units: '', input: RangeInput({min:2, max:255}), ...checkRange(2, 256) },      // lw.raster-to-gcode: Number of shades of gray [2-256]
    invertColor:    { name: 'invertColor', label: 'Invert Color', units: '', input: ToggleInput },                         // lw.raster-to-gcode
}

const ImageTraceControls={
    turnpolicy:     { name: 'turnpolicy', label: 'Turn Policy', hint:`How to resolve ambiguities in path decomposition`,  input: EnumInput(['minority', 'majority','black','white','right', 'left', 'random']) },                                // potrace
    turdsize:       { name: 'turdsize', label: 'Despeckle', hint:`Suppress speckles of up to this size (default 2)`, input: NumberInput,  },                                // potrace
    alphamax:       { name: 'alphamax',  label: 'Alpha Max', hint:`Corner threshold parameter (default 1)`,  input: NumberInput,  },                                // potrace
    optcurve:       { name: 'optcurve', label: 'Opt Curve', hint:`Optimize curves`, units: '', input: ToggleInput, },                       // potrace
    opttolerance:   { name: 'opttolerance', label: 'Opt Tolerance',hint:`Curve optimization tolerance (default 0.2)`, units: '', input: NumberInput },                // potrace
}

class ImageEditor extends React.Component
{
    constructor(props){
        super(props)
        this.state={
            params:{
                turnpolicy: 'minority', // potrace
                turdsize: 2,            // potrace
                optcurve: true,         // potrace
                alphamax: 1,            // potrace
                opttolerance: 0.2,      // potrace
            }, 
            filters: {
                smoothing: false,       // lw.raster-to-gcode: Smoothing the input image ?
                brightness: 0,          // lw.raster-to-gcode: Image brightness [-255 to +255]
                contrast: 0,            // lw.raster-to-gcode: Image contrast [-255 to +255]
                gamma: 0,               // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
                grayscale: 'none',      // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
                shadesOfGray: 256,      // lw.raster-to-gcode: Number of shades of gray [2-256]
                invertColor: false,     // lw.raster-to-gcode
            }
        }
        this.timeout=0;
        this.handleChange.bind(this)
        this.handleTrace.bind(this)
        this.handleNew.bind(this)
    }

    componentDidMount()
    {
        this.processImage();
        this.setState({svg:false})
    }

    componentDidUpdate()
    {
        this.processImage();
    }

    handleChange(key, change)
    {
        let state= Object.assign(this.state[key], change)
        this.setState(state)
    }

    handleTrace(e){
        let [wpx, hpx] = this.currentDocument.originalPixels;
        this.setState({working:true})
        Potrace.loadImageFromUrl(this.canvas.toDataURL())
        Potrace.setParameter(this.state.params)
        Potrace.process(function(){
            let svg=Potrace.getSVG(1)
            let blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
            let url = window.URL.createObjectURL(blob)
            this.trace.onload=function(){ 
                this.setState({working:false})
                window.URL.revokeObjectURL(url);
            }.bind(this)
            this.trace.src=url;
            this.setState({svg: svg.replace(/width="([^\"]+)" height="([^\"]+)"/gi, (str,w,h)=>{ 
                return `width="${wpx.toFixed(3)}mm" height="${hpx.toFixed(3)}mm" viewBox="0 0 ${wpx} ${hpx}" `} 
            )})
        }.bind(this))
    }

    handleFilters(e){
        confirm("Are you sure? This will modify current image data.",(data)=>{
            if (data) this.props.dispatch(setDocumentAttrs({dataURL:this.canvas.toDataURL()}, this.currentDocument.id))
        })
    }

    handleNew(e){
        let modifiers={};
        let doc = this.currentDocument
        this.setState({working:true})
        let parser = new Parser({});
            parser.parse(this.state.svg)
                .then((tags) => {
                    imageTagPromise(tags).then((tags) => {
                        let attrs = doc.transform2d ? { transform2d: doc.transform2d.slice() } : null;
                        this.props.dispatch(loadDocument({name: `Traced ${doc.name}`, type:'image/svg+xml'}, { parser, tags, attrs }, modifiers));
                         this.setState({working:false})
                    })
                })
                .catch((e) => {
                    console.error(e)
                })
        
    }

    handleDownload(e){
        if (this.state.svg) sendAsFile(this.currentDocument.name+".svg",this.state.svg,'image/svg+xml');
    }

    processImage()
    {
        if (!this.props.show) return false;

        let documents = this.props.data.documents
            .filter(d => (d.selected))

        
        clearTimeout(this.timeout)
        this.timeout=setTimeout(function(){
            if (documents.length) {
                this.currentDocument = documents[0];
                promisedImage(this.currentDocument.dataURL).then(function(image){
                    this.canvas.width = image.naturalWidth;
                    this.canvas.height = image.naturalHeight;
                    this.canvas.getContext("2d").drawImage(image, 0, 0)
                    canvasFilters(this.canvas, this.state.filters)
                }.bind(this))
            }
        }.bind(this),200)
        
            
       
    }

    render()
    {
        
        return <ImageEditorModal modal={{ show: this.props.show, onHide: this.props.onHide }}
                header="Image Editor"
                footer={this.state.working? "Working...." : (<div>
                    <Button bsStyle="warning" onClick={e=>this.handleFilters(e)}><Icon name="warning"/> Modify source image</Button>
                    <Button onClick={e=>this.handleTrace(e)}><Icon name="eye"/> Preview Trace</Button> 
                    <Button bsStyle="info" onClick={e=>this.handleDownload(e)} disabled={!this.state.svg}><Icon name="download"/> Download</Button>    
                    <Button bsStyle="success" onClick={e=>this.handleNew(e)} disabled={!this.state.svg}><Icon name="send"/> Create vector</Button>
                    
                </div>)}
                    
            >
            <div className="trace-image">
                <div className="showroom checker">
                    <canvas ref={(i)=>{this.canvas=i}} />
                    <img ref={(i)=>{this.trace=i}} src="" />
                </div>
                <div className="controls">
                    <div>
                        <h4>Filters</h4>
                        {Object.entries(ImageFilterControls).map((e,i)=>{
                            let [key, data] = e;
                            let Field = data.input;
                            return <div key={i} title={data.hint}><label>{data.label}</label> <Field op={this.state.filters} field={data} onChangeValue={v => this.handleChange('filters',{[key]:v}) } /></div>
                        })}
                    </div>
                    <div>
                        <h4>Trace <small><a href="http://potrace.sourceforge.net/" target="_blank" title="see Potrace"><Icon name="info-circle"/></a></small></h4>
                        {Object.entries(ImageTraceControls).map((e,i)=>{
                            let [key, data] = e;
                            let Field = data.input;
                            return <div key={i} title={data.hint}>
                                <label>{data.label}</label> <Field op={this.state.params} field={data} onChangeValue={v => this.handleChange('params',{[key]:v}) } /></div>
                        })}
                    </div>
                </div>
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