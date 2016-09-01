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
    run: function(root_path, port, online_callback) {
        // Create http server
        var http_server = http.createServer(function(request, response) {
            // Get the request uri
            var uri = url.parse(request.url).pathname;

            // Default uri
            if (uri === '/') {
                uri = '/index.html';
            }

            // Get content type from file extension
            var ext          = String(path.extname(uri)).toLowerCase();
            var content_type = mime_types[ext] || 'application/octect-stream';

            // Prepend the root path
            uri = root_path + uri;

            // Try to read the file
            fs.readFile(uri, function(error, content) {
                // On error
                if (error) {
                    // File not found
                    if (error.code == 'ENOENT') {
                        response.writeHead(404, { 'Content-Type': 'text/html' });
                        response.end('File Not Found', encoding);
                        console.error('http 404:', error);
                        return; // Exit...
                    }

                    response.writeHead(500, { 'Content-Type': 'text/html' });
                    response.end('Internal Server Error', encoding);
                    console.error('http 500:', error);
                    return; // Exit...
                }

                // File content ready, sent to client...
                response.writeHead(200, { 'Content-Type': content_type });
                response.end(content, encoding);
            });
        });

        // Start listening
        http_server.listen(port, online_callback || null);
    }
};
