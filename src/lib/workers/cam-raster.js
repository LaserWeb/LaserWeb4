import { RasterToGcode } from 'lw.raster-to-gcode'

// On messsage received
self.onmessage = function (event) {
    if (event.data.cmd === 'start') {
        start(event.data);
    }
}



// Start job
function start(data) {

    // Create RasterToGcode object
    var rasterToGcode = new RasterToGcode(data.settings);
        Object.assign( rasterToGcode, data.properties );
    // Register events callbacks
        rasterToGcode.on('progress', function (event) {
            self.postMessage({ event: 'onProgress', ...event });
        }).on('done', function (event) {
            self.postMessage({ event: 'onDone', ...event });
        }).on('abort', function () {
            self.postMessage({ event: 'onAbort' });
        });

    
    self.postMessage({ event: 'start' });
    rasterToGcode.run();

}

// Abort job
function abort() {
    rasterToGcode.abort();
}