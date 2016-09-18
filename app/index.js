// This hacks a hot-reloading React pane into a non-React app. 
// Long term, if the main app moves to React then this should 
// hot-reload the main app and know nothing about panes.

import {initCam} from './laserweb/layout/panes/cam/cam.js';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

export class CamPaneContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.changed = () => this.forceUpdate();
    }

    render() {
        const CamPane = require('./laserweb/layout/panes/cam/cam.js').CamPane;
        return (<CamPane state={this.state} changed={this.changed}/>);
    }
}

let state = {};
let camPane;
function renderCamPane() {
    const CamPane = require('./laserweb/layout/panes/cam/cam.js').CamPane;
    ReactDOM.render(<CamPaneContainer/>, camPane);
}
initCam(laserweb, cp => {
    camPane = cp;
    renderCamPane();
});

if (module.hot) {
    module.hot.accept('./laserweb/layout/panes/cam/cam.js', renderCamPane);
}
