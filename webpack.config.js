var webpack = require('webpack');
var path = require('path');

var src_path = path.resolve('./src');
var dist_path = path.resolve('./dist');

// https://webpack.js.org/migrate/3/#module-loaders-is-now-module-rules

module.exports = {
    mode: 'development',
    context: src_path,
    entry: [
        'babel-polyfill', './index.js'
    ],
    output: {
        path: dist_path,
        filename: 'index.js'
    },
    node: { "fs": "empty" },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                query: {
                    presets: ['react'],
                    plugins: ['transform-es2015-destructuring', 'transform-es2015-parameters', 'transform-object-rest-spread', 'transform-es2015-modules-commonjs', 'react-hot-loader/babel']
                }
            }],
        },
        {
            test: /\.css$/,
            use: [{
                loader: "style-loader"
            },
            {
                loader: "css-loader"
            }]
        },
        {
            test: /\.png$/,
            use: [{
                loader: "url-loader",
                options: {
                    limit: 100000
                }
            }]
        },
        {
            test: /\.jpg$/,
            use: [{
                loader: "file-loader"
            }]
        },
        {
            test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
            use: [{
                loader: "url-loader",
                options: {
                    limit: 10000,
                    mimetype: "application/font-woff"
                }
            }]
        },
        {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            use: [{
                loader: "url-loader",
                options: {
                    limit: 10000,
                    mimetype: "application/octet-stream"
                }
            }]
        },
        {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            use: [{
                loader: "file-loader"
            }]
        },
        {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            use: [{
                loader: "url-loader",
                options: {
                    limit: 10000,
                    mimetype: "image/svg+xml"
                }
            }]
        },
        {
            test: /\.wasm$/,
            use: [{
                loader: "file-loader",
                options: {
                    publicPath: "dist/"
                }
            }]
        },
        {
            test: /\.md$/,
            use: [{
                loader: "markdown-loader"
            }]
        },
        {
            test: /\.swf$/,
            use: [{
                loader: "file-loader",
                options: {
                    name: "[path][name].[ext]"
                }
            }]
        },
        {
            test: require.resolve('snapsvg/dist/snap.svg.js'),
            use: 'imports-loader?this=>window,fix=>module.exports=0'
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({$: 'jquery', jQuery: 'jquery'}),
        new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {
        alias: {
            snapsvg: 'snapsvg/dist/snap.svg.js',
        },
    },
    devtool: 'source-map'
};
