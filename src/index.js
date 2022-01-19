import React from 'react'
import { render } from 'react-dom'
import { compose, applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';

import { alert } from './components//laserweb'

import persistState, {mergePersistedState} from 'redux-localstorage'
import adapter from 'redux-localstorage/lib/adapters/localStorage';
import filter from 'redux-localstorage-filter';

export const LOCALSTORAGE_KEY = 'LaserWeb';
export const DEBUG_KEY = "LaserwebDebug";

const hot = (state, action) => {
    return require('./reducers').default(state, action);
};

const reducer = compose(
    mergePersistedState((initialState, persistedState) => {
        let state = { ...initialState, ...persistedState };
        state.camera = require('./reducers/camera').resetCamera(null, state.settings);
        return hot(state, { type: 'LOADED' });
    })
)(hot);

const storage = compose(
  filter(['settings','machineProfiles','splitters','materialDatabase'])
)(adapter(window.localStorage));


// adds getState() to any action to get the global Store :slick:
const globalstoreMiddleWare =  store => next => action => {
  next({ ...action, getState: store.getState });
};

// Prevent drag-n-drop into main window.
window.addEventListener("dragover",function(e){
  e = e || event;
  e.preventDefault();
},false);
window.addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
  alert("Please use the <span class='fa fa-fw fa-folder-open'></span><strong>Add Document</strong> button in the files tab to import documents into LaserWeb")
},false);


export const getDebug = () =>{
    return window.localStorage.getItem(DEBUG_KEY)==='true';
}

export const setDebug=(b) => {
    window.localStorage.setItem(DEBUG_KEY,String(b))
}

const middlewares=[];
if (getDebug()) middlewares.push(createLogger({ collapsed: true }))
middlewares.push(globalstoreMiddleWare)

const middleware = compose(
  applyMiddleware(...middlewares),
  persistState(storage, LOCALSTORAGE_KEY),
);

const store = createStore(reducer, middleware);

// Bad bad bad
export function GlobalStore()
{
    return store;
}

function Hot(props) {
    const LaserWeb = require('./components/laserweb').default;
    return <LaserWeb />;
}

function renderHot() {
    render((
        <Provider store={store}>
            <Hot />
        </Provider>
    ), document.getElementById('laserweb'));
}
renderHot();

if (module.hot) {
    module.hot.accept('./reducers', renderHot);
    module.hot.accept('./components/laserweb', renderHot);
}
