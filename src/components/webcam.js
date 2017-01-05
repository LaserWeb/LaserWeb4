import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import { getUserMedia } from 'getusermedia-js';
import fx from 'glfx'
import '../styles/webcam.css';

import Draggable from 'react-draggable';
import Icon from './font-awesome'

export class Webcam extends React.Component {

    componentWillUnmount() {
        this._stopVideo(this.stream);
    }

    componentDidMount() {
        this.canvas = new fx.canvas();
        ReactDOM.findDOMNode(this).appendChild(this.canvas)

        const capture = () => {
            let texture = this.canvas.texture(this.video)
            texture.loadContentsOf(this.video);

            this.canvas.draw(texture);

            if (this.props.perspective) {
                let {before, after} = this.props.perspective;
                if (before && after)
                    this.canvas.perspective(before, after)
            }

            this.canvas.update();

            requestAnimationFrame(capture);

        }

        getUserMedia({
            video: this.props.video || true,
            audio: this.props.audio || false,
            width: this.props.width || 640,
            height: this.props.height || 480,
            el: 'stream', // render live video in #stream
            swffile: require('getusermedia-js/dist/fallback/jscam_canvas_only.swf'),
        }, stream => {
            this.stream = stream;
            this._startVideo(this.stream);
            capture();
        }, err => console.error(err));

    }

    _startVideo(stream) {
        this.video = ReactDOM.findDOMNode(this).querySelector('#stream video');
        this.canvas.width = this.video.width;
        this.canvas.height = this.video.height;
        this.video.src = window.URL.createObjectURL(stream);
        this.video.play();
    };

    _stopVideo(stream) {
        if (this.video)
            this.video.parentNode.removeChild(this.video);
        window.URL.revokeObjectURL(stream);
    }

    render() {
        return <div className="webcamViewport" style={{ width: this.props.width, height: this.props.height, overflow: "hidden" }}>
            <div id="stream"></div>
        </div>
    }

}

export class Coordinator extends React.Component {

    constructor(props) {
        super(props);
        this.state = { position: this.props.position || [0, 0, 0, 0, 0, 0, 0, 0] }
        this.handleDrag.bind(this)
    }

    handleDrag(e, ui, index) {
        let position = Object.assign({}, this.state.position);
        position[index * 2] = position[index * 2] + ui.deltaX;
        position[index * 2 + 1] = position[index * 2 + 1] + ui.deltaY;
        this.setState({ position: position });

        if (this.props.onChange)
            this.props.onChange(position)
    }

    render() {

        let dots = this.props.dots || ['red', 'green', 'blue', 'purple']
        let dotSize = this.props.dotSize || 10;
        let symbol = this.props.symbol || ((props) => { return <svg height="100%" width="100%"><circle r="50%" cx="50%" cy="50%" fill={props.fill} stroke="white" strokeWidth="1" /></svg> })

        return <div className="coordinator" style={{ width: this.props.width, height: this.props.height, position: 'relative', overflow: 'hidden', border: "1px solid #eee", ...this.props.style }}>
            {dots.map((fill, i) => {
                return <Draggable onDrag={(e, ui) => this.handleDrag(e, ui, i)} key={i} position={{ x: this.state.position[i * 2], y: this.state.position[i * 2 + 1] }} bounds="parent">
                    <div className="symbol" style={{ cursor: "move", marginTop: -dotSize / 2, marginLeft: -dotSize / 2, width: dotSize, height: dotSize }}>{symbol({ fill })}</div>
                </Draggable>
            })}
        </div>
    }
}

export class PerspectiveWebcam extends React.Component {

    constructor(props) {
        super(props);
        let w = this.props.width;
        let h = this.props.height;
        this.state = {
            before: [
                w * 0.2, h * 0.8,
                w * 0.8, h * 0.8,
                w * 0.8, h * 0.2,
                w * 0.2, h * 0.2
            ],
            after: [
                w * 0.2, h * 0.8,
                w * 0.8, h * 0.8,
                w * 0.8, h * 0.2,
                w * 0.2, h * 0.2
            ],
        }
        this.handleChange.bind(this)
    }

    handleChange(position, key) {
        this.setState({ [key]: Object.values(position) })
    }

    render() {

        let before = this.state.before;
        let after = this.state.after;
        return <div className="perspectiveWebcam">
            <div className="viewPort">
                <Webcam width={this.props.width} height={this.props.height} perspective={{ before, after }} />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handleChange(position,"before") } }
                    position={this.state.before}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    symbol = {
                        (props) => { return <svg height="100%" width="100%"><rect x="0" y="0" width="10" height="10" fill={props.fill} stroke="white" strokeWidth="1" /></svg> }
                    }
                    />
                <Coordinator width={this.props.width} height={this.props.height}
                    onChange={(position) => { this.handleChange(position,"after") } }
                    position={this.state.after}
                    style={{ position: "absolute", top: "0px", left: "0px" }}
                    />
            </div>
            <code>{JSON.stringify(this.state)}</code>
        </div>
    }

}

Webcam = connect()(Webcam);
Coordinator = connect()(Coordinator);
PerspectiveWebcam = connect()(PerspectiveWebcam);
