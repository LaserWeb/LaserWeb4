var config = require('./config');
var http   = require('./servers/http');
var app    = require('http').createServer(http.handler);
var io     = require('socket.io')(app, { path: '/vendor/socket.io' });

app.listen(config.port, function() {
    console.log(http.footprint);
    console.log('Listening on http://localhost:%s', config.port);
});
