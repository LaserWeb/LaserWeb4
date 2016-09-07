var config = require('./config');
var http   = require('./servers/http');
var serial = require('./servers/serial');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io');
var os     = require('os');

app.listen(config.port, function() {
    console.log(http.footprint);

    var interfaces = os.networkInterfaces();

    for (name in interfaces) {
        var interface = interfaces[name];
        interface.forEach(function(entry) {
            if (entry.family === 'IPv4') {
                console.log('Listening on http://%s:%s', entry.address, config.port);
            }
        });
    }

    console.log('Listening on http://localhost:%s', config.port);

    var ws = io(app, { path: '/vendor/socket.io' });

    ws.on('connection', serial.attach);
});
