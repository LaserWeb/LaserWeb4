// This hacks a hot-reloading React pane into a non-React app. 
// Long term, if the main app moves to React then this should 
// hot-reload the main app and know nothing about panes.

import {initCam} from './laserweb/layout/panes/cam/cam.js';
import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import logger from 'redux-logger';
import undoable, {ActionCreators} from 'redux-undo';

const hotCam = (state, action) => {
    return require('./laserweb/layout/panes/cam/cam.js').cam(state, action);
};

const middleware = applyMiddleware(logger());
const store = createStore(undoable(hotCam), middleware);

function HotCamPane(props) {
    console.log('...', props)
    const CamPane = require('./laserweb/layout/panes/cam/cam.js').CamPane;
    return (
        <div>
            <button onClick={e => props.dispatch(ActionCreators.undo()) }>Undo</button>
            <button onClick={e => props.dispatch(ActionCreators.redo()) }>Redo</button>
            <CamPane cam={props.cam}/>
        </div>
    );
}
HotCamPane = connect(
    store => ({ cam: store.present })
)(HotCamPane);

let state = {};
let camPane;
function renderCamPane() {
    ReactDOM.render((
        <Provider store={store}>
            <HotCamPane/>
        </Provider>
    ), camPane);
}

initCam(laserweb, cp => {
    camPane = cp;
    renderCamPane();
});

if (module.hot) {
    module.hot.accept('./laserweb/layout/panes/cam/cam.js', renderCamPane);
}
