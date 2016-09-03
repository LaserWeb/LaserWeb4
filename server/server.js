var config = require('./config');
var http   = require('./servers/http');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io')(app, { path: '/vendor/socket.io' });
var os     = require('os');

app.listen(config.port, os.hostname(), function() {
    var host = app.address();
    console.log(http.footprint);
    console.log('Listening on http://%s:%s', host.address, host.port);
});

io.on('connection', function(socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});
