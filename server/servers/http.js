/**
* Imports
*/
var http = require('http');
var fs   = require('fs');
var path = require('path');
var url  = require("url");

/**
* Encoding
*/
encoding = 'utf-8';

/**
* Mime types
*/
var mime_types = {
    '.html': 'text/html',
    '.js'  : 'text/javascript',
    '.css' : 'text/css',
    '.json': 'application/json',
    '.png' : 'image/png',
    '.jpg' : 'image/jpg',
    '.gif' : 'image/gif',
    '.wav' : 'audio/wav',
    '.mp4' : 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf' : 'applilcation/font-ttf',
    '.eot' : 'application/vnd.ms-fontobject',
    '.otf' : 'application/font-otf',
    '.svg' : 'application/image/svg+xml'
};

/**
* Exports
*/
exports.server = {
    run: function(settings) {
        // Defaults settings
        settings           = settings || {};
        settings.port      = settings.port || 8080;
        settings.root      = settings.root || __dirname;

        // Defaults headers
        var headers = { 'Content-Type': 'text/html' };

        // Customs headers
        if (settings.footprint) {
            headers['Server'] = settings.footprint;
        }

        // Create http server
        var http_server = http.createServer(function(request, response) {
            // Get the request uri
            var uri = url.parse(request.url).pathname;

            // Default uri
            if (uri === '/') {
                uri = '/index.html';
            }

            // Prepend the root path
            uri = settings.root + uri;

            // Try to read the file
            fs.readFile(uri, function(error, content) {
                // On error
                if (error) {
                    // File not found
                    if (error.code == 'ENOENT') {
                        response.writeHead(404, headers);
                        response.end('File Not Found', encoding);
                        console.error('http 404:', error);
                        return; // Exit...
                    }

                    // Internal server error (read dir, file permision, etc...)
                    response.writeHead(500, headers);
                    response.end('Internal Server Error', encoding);
                    console.error('http 500:', error);
                    return; // Exit...
                }

                // Get the file extension
                var ext = String(path.extname(uri)).toLowerCase();

                // Set content type header from file extension
                headers['Content-Type'] = mime_types[ext] || 'application/octect-stream';

                // File content ready, sent to client...
                response.writeHead(200, headers);
                response.end(content, encoding);
            });
        });

        // Start listening
        http_server.listen(settings.port, settings.online || null);
    }
};
