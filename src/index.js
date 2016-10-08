import React from 'react'
import { render } from 'react-dom'
import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import logger from 'redux-logger';

const middleware = applyMiddleware(logger({ collapsed: true }));

const hot = (state, action) => {
    return require('./reducers').default(state, action);
};

const store = createStore(hot, middleware);

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
