/**
* Imports
*/
var os = require('os');

/**
* Configuration
*/
var http_server_config = {
    port     : 8080,
    main     : '/index.html',
    root     : __dirname + '/../app/',
    footprint: 'LaserWebServer/0.0.1 ' + os.platform() + '/' + os.release()
};

/**
* HTTP server
*/
var http_server = require('./servers/http').server;

// Launch the serveur
http_server.run({
    port     : http_server_config.port,
    main     : http_server_config.main,
    root     : http_server_config.root,
    footprint: http_server_config.footprint,
    online   : function() {
        // Called when server is online!
        console.log("Server listening on: http://localhost:%s", http_server_config.port);
    }
});
