import React from 'react'
import { render } from 'react-dom'
import { compose, applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import logger from 'redux-logger';

import persistState, {mergePersistedState} from 'redux-localstorage'
import adapter from 'redux-localstorage/lib/adapters/localStorage';
import filter from 'redux-localstorage-filter';


const hot = (state, action) => {
    return require('./reducers').default(state, action);
};

const reducer = compose(
  mergePersistedState()
)(hot);

const storage = compose(
  filter('settings')
)(adapter(window.localStorage));

const middleware = compose(
  applyMiddleware( logger({ collapsed: true })),
  persistState(storage, 'LaserWeb')
);

const store = createStore(reducer, middleware);

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
