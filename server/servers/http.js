/**
* Imports
*/
var config = require('../config');
var http   = require('http');
var fs     = require('fs');
var path   = require('path');
var url    = require('url');
var os     = require('os');

/**
* HTTP Handler
*/
var hh = exports;

hh.encoding = 'utf-8';

hh.mime_types = {
    '.html': 'text/html',
    '.js'  : 'text/javascript',
    '.css' : 'text/css',
    '.json': 'application/json',
    '.png' : 'image/png',
    '.jpg' : 'image/jpg',
    '.jpeg': 'image/jpg',
    '.gif' : 'image/gif',
    '.wav' : 'audio/wav',
    '.mp4' : 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf' : 'applilcation/font-ttf',
    '.eot' : 'application/vnd.ms-fontobject',
    '.otf' : 'application/font-otf',
    '.svg' : 'application/image/svg+xml'
};

hh.footprint = config.name + '/' + config.version + ' ' + os.platform() + '/' + os.release();

hh.headers = {};

hh.uri = null;

hh.get_content_type = function(file) {
    // Get the file extension
    var ext = String(path.extname(file)).toLowerCase();

    // Return the content type header from file extension
    return hh.mime_types[ext] || 'application/octect-stream';
};

hh.handler = function(request, response) {
    // Get the requested uri
    hh.uri = url.parse(request.url).pathname;

    // Default uri
    if (hh.uri === '/') {
        hh.uri += config.main_file;
    }

    // Reset headers
    hh.headers = {
        // Server signature
        'Server': hh.footprint,

        // Content type
        'Content-Type': 'text/html',

        // Website you wish to allow to connect
        'Access-Control-Allow-Origin': '*',

        // Request methods you wish to allow
        'Access-Control-Allow-Methods': 'GET, POST, HEAD',

        // Request headers you wish to allow
        'Access-Control-Allow-Headers': 'X-Requested-With,content-type',

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        'Access-Control-Allow-Credentials': true
    };

    // Make the file path
    var file_path = config.app_path + hh.uri;

    // Try to read the file
    fs.readFile(file_path, function(error, content) {
        // On error
        if (error) {
            // File not found
            if (error.code == 'ENOENT') {
                response.writeHead(404, hh.headers);
                response.end('File Not Found', hh.encoding);
                //console.error('Error 404:', error);
                return; // Exit...
            }

            // Internal server error (read dir, file permision, etc...)
            this.response.writeHead(500, hh.headers);
            this.response.end('Internal Server Error', hh.encoding);
            console.error('Error 500:', error);
            return; // Exit...
        }

        // Get and set content type header from file extension
        hh.headers['Content-Type'] = hh.get_content_type(file_path);

        // File content ready, sent to client...
        response.writeHead(200, hh.headers);
        response.end(content, hh.encoding);
    });
};
