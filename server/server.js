var config = require('./config');
var http   = require('./servers/http');
var serial = require('./servers/serial');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io');
var os     = require('os');

app.listen(config.port, os.hostname(), function() {
    var host = app.address();

    console.log(http.footprint);
    console.log('Listening on http://%s:%s', host.address, host.port);

    var ws = io(app, { path: '/vendor/socket.io' });
    
    ws.on('connection', serial.attach);
});
