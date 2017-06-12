import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';
import Rnd from 'react-rnd';
import { canvasFilters } from '../lib/lw.raster2gcode/canvas-filters';
import { OPERATION_GROUPS } from './operation';
import { getSubset } from 'redux-localstorage-filter';

const promisedImage = (path) => {
    return new Promise(resolve => {
        let img = new Image();
        img.onload = () => {
            resolve(img)
        }
        img.src = path;
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