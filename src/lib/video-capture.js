import 'webrtc-adapter';

import queue from 'queue';

export const DEFAULT_VIDEO_RESOLUTION = "720p(HD)";
export const VIDEO_RESOLUTIONS = {
    "4K(UHD)": { "width": 3840, "height": 2160, "ratio": "16:9" },
    "*Emblaser2" : {"width": 2592, "height": 1944, "ratio": "4:3"},
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

export const VIDEO_CAPTURE_CACHE_KEY = 'LaserWeb-VideoCapture'

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
            navigator.getUserMedia(constraints,
            (stream)=>{
                stream.getTracks().forEach((track) => { track.stop(); });
                resolve(candidate)
            },console.warning);
        }
    )
}

export const getSizeByVideoResolution = (pixels, resolution, orientation = 'height') => {
    if (!resolution) resolution = DEFAULT_VIDEO_RESOLUTION
    let ratio = VIDEO_RESOLUTIONS[resolution].ratio;
    if (isNaN(ratio)) {
        let p = ratio.split(":")
        ratio = p[0] / p[1];
    }
    if (orientation == 'height') {
        return { width: pixels * ratio, height: pixels }
    } else {
        return { width: pixels, height: pixels / ratio }
    }
}

export const getVideoResolution = (resolution) => {
    if (!Object.keys(VIDEO_RESOLUTIONS).includes(resolution))
        resolution = DEFAULT_VIDEO_RESOLUTION;

    return VIDEO_RESOLUTIONS[resolution];
}

export class VideoCapture {
    constructor() {
        this.stream = undefined
        this.isReady = false;
        this.props = {}
        this.data={stream:undefined, deviceId: null, resolutionId: DEFAULT_VIDEO_RESOLUTION, resolutions:[], devices:[]}
    }

    createStream(props, callback=(stream)=>{console.log(stream)}) {
        this.isReady = false;
        this.props=props
        let { device, resolution, constraints = {}} = props;
        resolution = getVideoResolution(resolution);

        this.stopStream(this.stream)

        constraints = Object.assign({ video: true, audio: false }, constraints)
        
        if (device) {
            constraints = Object.assign(constraints, {
                deviceId: { exact: device },
                width: { exact: resolution.width },
                height: { exact: resolution.height }
            });
            console.log("requesting video: "+JSON.stringify(constraints))

            let that=this;

            navigator.getUserMedia(constraints, (stream)=>{
                that.stream = stream;
                that.isReady = true;
                callback(that.stream)
            },(err)=> {
                console.error(err)
            })
        }
        

    }

    stopStream() {
        if (this.stream) {
            this.isReady = false;
            this.stream.getTracks().forEach((track) => { track.stop(); this.stream.removeTrack(track) });
            window.URL.revokeObjectURL(this.stream);
            this.stream=undefined;
        }
    }

    refreshStream(props, callback)
    {
        if (!props) props=this.props;

        this.createStream(props ,callback)
    }

    getStream() {
        return this.stream;
    }


    getVideo(props, callback) {
        let that = this;
        let { width, height } = getSizeByVideoResolution(props.height, props.resolution);

        let video = document.createElement('video');
            video.width = width;
            video.height = height;
            video.addEventListener('canplaythrough', (e) => {
                if (video && video.readyState === 4) {
                    callback.apply(null, [video])
                }
            }, false)
        if (this.stream){
            video.srcObject = this.stream;
            video.play();
        }
    };

    getResolutions(deviceId, callback, useCache=true) {
        let cache=this.getCache();
        if (deviceId && typeof(cache[deviceId])!=='undefined'){
            callback(cache[deviceId])
            return;
        }

        const resolutions=[];
        const QE=new queue();
              QE.concurrency = 1;
              QE.timeout = 2000

        Object.entries(VIDEO_RESOLUTIONS).forEach((entry)=>{
            QE.push((cb)=>{
                let candidate = entry[1];
                
                let constraints = {
                    audio: false,
                    video: {
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        width: { exact: candidate.width },    
                        height: { exact: candidate.height }   
                    }
                }

                navigator.getUserMedia(constraints, (stream)=>{
                    stream.getTracks().forEach((track) => { track.stop(); stream.removeTrack(track) });
                    resolutions.push({ label: entry[0], ...entry[1] })
                    cb()
                }, (err)=>{ 
                    cb()
                })
            })
        }) 

        QE.start((err) => {
            cache[deviceId] = resolutions;
            this.setCache(cache)
            callback(resolutions)
        })
    }

    getDevices(callback){
        let promise = navigator.mediaDevices.enumerateDevices();
        let that = this;
        promise.then((devices) => {
            let cameras = [];
            devices.forEach((device) => {
                if (device.kind == 'videoinput')
                    cameras.push({ label: device.label, value: device.deviceId })
            })
            cameras.unshift({ label: "None", value: null })
            callback(cameras)
        }).catch(function (err) {
            console.error(err.name + ": " + err.message);
        });
    }

    scan(deviceId, resolutionId, callback)
    {
        console.log("scanning media devices")
        this.isReady=false;
        this.getDevices((devices)=>{
            console.log("devices found:"+ JSON.stringify(devices) )
            if (!deviceId) {
                console.log("video disabled")
                this.data={stream:undefined, deviceId: null, resolutionId: resolutionId || DEFAULT_VIDEO_RESOLUTION, resolutions:[], devices}
                callback(this.data)
            } else if (deviceId && devices.map((device)=>{return device.value}).includes(deviceId)){
                console.log("selected device: "+deviceId)
                window.videoCapture.getResolutions(deviceId, (resolutions)=>{
                    console.log("resolutions found: "+JSON.stringify(resolutions))
                    if (!resolutions.map((resolution)=>{return resolution.label}).includes(resolutionId))
                        resolutionId = resolutions[0].label;
                    console.log("selected resolution: "+resolutionId)
                    window.videoCapture.createStream({
                        device: deviceId, //device id
                        resolution: resolutionId || DEFAULT_VIDEO_RESOLUTION,   //named target resolution
                    }, (stream)=>{
                        console.log("stream: "+stream.id)
                        this.data = {stream, deviceId, resolutionId, resolutions, devices}
                        callback(this.data)
                    })
                })
            } else {
                console.log("selected device not found")
                callback(false)
            }
        })
    }

    getCache()
    {
        return JSON.parse(window.localStorage.getItem(VIDEO_CAPTURE_CACHE_KEY)) || {}
    }

    setCache(data, replace=false)
    {
        if (!replace) data=Object.assign(this.getCache(), data)
        window.localStorage.setItem(VIDEO_CAPTURE_CACHE_KEY, JSON.stringify(data))
    }

}