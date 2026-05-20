/* HACK: This is a temporary fix to suppress the hundreds of "warnings"
 * (frustratingly actually logged as errors for some reason) that React
 * emits because of us using an old version of react-bootstrap. As newer
 * versions of react-bootstrap change the components available to us, we
 * can't reasonably upgrade it until the UI code has been sufficiently
 * deduplicated to make it practical to replace these components.
 * 
 * Therefore, to retain a semblance of a usable browser console, we're
 * just going to ignore these errors for now.
 * 
 * FIXME: Actually do that react-bootstrap upgrade. It is really needed. */
let consoleError_ = console.error;
console.error = function (... args) {
    if (!args[0]?.includes("ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported in React 18.")) {
    // if (!args[0]?.startsWith("Warning: ")) {
        consoleError_.call(console, ... args);
    } else {
        /* We do still log it as a compact warning, to ensure that this
         * issue doesn't get overlooked in the long term. Developers can
         * filter out all warnings in their browser console anyway. */
        console.warn(`(... ReactDOM.unstable_renderSubtreeIntoContainer() warning suppressed ...)`);
    }
}

import React from 'react'
import { createRoot } from 'react-dom/client'
import { compose, applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';

import { alert } from './components/laserweb'

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
    const domNode = document.getElementById('laserweb');
    const root = createRoot(domNode);

    root.render((
        <Provider store={store}>
            <Hot />
        </Provider>
    ));
}
renderHot();

if (module.hot) {
    module.hot.accept('./reducers', renderHot);
    module.hot.accept('./components/laserweb', renderHot);
}
