import { RasterToGcode } from 'lw.raster-to-gcode'

// On messsage received
self.onmessage = function(event) {
    if (event.data.cmd === 'start') {
        start(event.data);
    }
}

// Create RasterToGcode object
var rasterToGcode = new RasterToGcode();

// Register events callbacks
rasterToGcode.on('progress', function(event) {
    self.postMessage({ event: 'onProgress', ...event });
})
.on('done', function(event) {
    self.postMessage({ event: 'onDone', ...event });
})
.on('abort', function() {
    self.postMessage({ event: 'onAbort' });
});

// Start job
function start(data) {
    Object.assign(rasterToGcode, data.properties);
    self.postMessage({ event: 'onStart' });
    rasterToGcode.run(data.settings);
}

// Abort job
function abort() {
    rasterToGcode.abort();
}