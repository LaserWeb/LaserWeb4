var path = require('path');
var webpack = require('webpack');

var port = process.env.PORT || 8080

module.exports = {
    version  : '0.0.1',
    name     : 'LaserWebServer',
    app_path : __dirname + '/../app',
    main_file: 'index.html',
    port: port,

    devtool: 'eval',
    entry: [
        'webpack-dev-server/client?http://0.0.0.0:' + port,
        'webpack/hot/only-dev-server',
        './app/index.js',
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/generated/'
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            includes: [
                './index.js',
                path.join(__dirname, '../app')],
            query: {
                "presets": ["es2015", "stage-0", "react"],
                "plugins": ["react-hot-loader/babel"]
            },
        }]
    }
};
