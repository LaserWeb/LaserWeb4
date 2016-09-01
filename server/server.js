/**
* Configuration
*/
var http_server_port = 8080;
var http_server_root = __dirname + '/../app/';

/**
* HTTP server
*/
var http_server = require('./servers/http').server;

// Launch the serveur
http_server.run(http_server_root, http_server_port, function() {
    // Called when server is online!
    console.log("Server listening on: http://localhost:%s", http_server_port);
});
