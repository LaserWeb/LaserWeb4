import getUserMedia from 'getusermedia';

export const DEFAULT_VIDEO_RESOLUTION = "720p(HD)";
export const VIDEO_RESOLUTIONS = {
    "4K(UHD)": { "width": 3840, "height": 2160, "ratio": "16:9" },
    "1080p(FHD)": { "width": 1920, "height": 1080, "ratio": "16:9" },
    "UXGA": { "width": 1600, "height": 1200, "ratio": "4:3" },
    "720p(HD)": { "width": 1280, "height": 720, "ratio": "16:9" },
    "SVGA": { "width": 800, "height": 600, "ratio": "4:3" },
    "VGA": { "width": 640, "height": 480, "ratio": "4:3" },
    "360p(nHD)": { "width": 640, "height": 360, "ratio": "16:9" },
    "CIF": { "width": 352, "height": 288, "ratio": "4:3" },
    "QVGA": { "width": 320, "height": 240, "ratio": "4:3" },
    "QCIF": { "width": 176, "height": 144, "ratio": "4:3" },
    "QQVGA": { "width": 160, "height": 120, "ratio": "4:3" }
};


export const videoResolutionPromise = (deviceId, candidate) => {
    const constraints = {
        audio: false,
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { exact: candidate.width },    //new syntax
            height: { exact: candidate.height }   //new syntax
        }
    }

    return new Promise(
        (resolve) => {
            getUserMedia(constraints, (err, stream) => {
                if (!err) {
                    stream.getTracks().forEach((track) => { track.stop(); });
                    resolve(candidate)
                }
            });
        }
    )
}

export const getSizeByVideoResolution = (pixels, resolution, orientation='height') => {
    if (!resolution) resolution = DEFAULT_VIDEO_RESOLUTION
    let ratio = VIDEO_RESOLUTIONS[resolution].ratio;
    if (isNaN(ratio)) {
        let p = ratio.split(":")
        ratio = p[0] / p[1];
    }
    if (orientation=='height'){
        return { width: pixels * ratio, height: pixels }
    } else {
        return { width: pixels, height: pixels / ratio }
    }
}

export const getVideoResolution = (resolution) =>{
    if (!Object.keys(VIDEO_RESOLUTIONS).includes(resolution))
        resolution = DEFAULT_VIDEO_RESOLUTION;

    return VIDEO_RESOLUTIONS[resolution];
}

export class VideoCapture {
    constructor() {
        this.stream = undefined
        this.isReady=false;
    }

    createStream(props, callback) {
        this.isReady = false;
        let { device, resolution, constraints={}, width= 640, height= 480 } = props;
            resolution = getVideoResolution(resolution);

        this.stopStream(this.stream)

        constraints = Object.assign({ video: true, audio: false }, constraints)
        if (device) {
            constraints = Object.assign(constraints, {
                deviceId: { exact: device },
                width: { exact: resolution.width },
                height: { exact: resolution.height }
            });
        }
        
        getUserMedia(constraints, (err, stream) => {
            if (err) {
                console.error(err);
            } else {
                //console.log(stream)
                this.stream = stream;
                this.isReady=true;
                callback(this.stream)
            }
        })
        
    }

    stopStream() {
        if (this.stream){
            console.log(this.stream);
            this.stream.getTracks().forEach((track) => { track.stop(); });
            window.URL.revokeObjectURL(this.stream);
        }
        this.isReady=false;
    }

    getStream() {
        return this.stream;
    }

    
    getVideo( props, callback) {
        let that=this;
        let { width, height } = getSizeByVideoResolution(props.height, props.resolution);
        
        let video = document.createElement('video');
            video.width = width;
            video.height = height;
            video.addEventListener('canplaythrough', (e) => {
                if (video && video.readyState === 4){
                    callback.apply(null, [video])
                } 
            }, false)
            video.src = window.URL.createObjectURL(this.stream);
            video.play();
    };

    /*
    getVideo()
    {
        return window.webcam;
    }

    getStream()
    {
        return this.stream;
    }

    _startVideo(stream, props, callback) {
        let that=this;
        let { width, height } = getSizeByVideoResolution(props.height, props.resolution);
        
        window.webcam = document.createElement('video');
        window.webcam.width = width;
        window.webcam.height = height;
        window.webcam.addEventListener('canplaythrough', (e) => {
            if (window.webcam && window.webcam.readyState === 4){
                this.isReady=true;
                callback.apply(null, [window.webcam])
            } 
        }, false)
        window.webcam.src = window.URL.createObjectURL(stream);
        window.webcam.play();
        console.log(props)
    };

    stopVideo() {
        if (this.stream){
            console.log(this.stream);
            this.stream.getTracks().forEach((track) => { track.stop(); });
            window.URL.revokeObjectURL(this.stream);
        }
        this.isReady=false;
    }
    */
    

}