import React from 'react';
import ReactDOM from 'react-dom'
import { connect } from 'react-redux';

import { getUserMedia } from 'getusermedia-js';
import fx from 'glfx'
import '../styles/webcam.css';

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
        this.video.parentNode.removeChild(this.video);
        window.URL.revokeObjectURL(stream);
    }

    render() {
        return <div className="webcamViewport"><div id="stream"></div></div>
    }

}

Webcam = connect()(Webcam);