var config = require('./config');
var http   = require('./servers/http');
var serial = require('./servers/serial');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io');
var os     = require('os');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');

new WebpackDevServer(webpack(config), {
    contentBase: 'app',
    publicPath : config.output.publicPath,
    hot : true,
    historyApiFallback : true
}).listen(config.port, '0.0.0.0', function(err, result) {
    if (err) {
        return console.log(err);
    }

    // List all available IP
    var interfaces = os.networkInterfaces();

    for (var name in interfaces) {
        // Current interface
        var interface = interfaces[name];

        // For each entry
        interface.forEach(function(entry) {
            // Print only IPv4 address
            if (entry.family === 'IPv4') {
                console.log('Listening on http://%s:%s', entry.address, config.port);
            }
        });
    }

    // Print default localhost address
    console.log('Listening on http://localhost:%s', config.port);
});
