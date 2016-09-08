var config = require('./config');
var http   = require('./servers/http');
var serial = require('./servers/serial');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io');
var os     = require('os');

app.listen(config.port, function() {
    // Print the server footprint
    console.log(http.footprint);

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

    // Start the socket io connection
    var ws = io(app, { path: '/vendor/socket.io' });

    // Attach serial interface on connection
    ws.on('connection', serial.attach);
});
