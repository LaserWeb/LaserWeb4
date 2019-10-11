import AR from './js-aruco/aruco.js';
import POS from './js-aruco/posit2.js';

const DEFAULT_MODEL_SIZE = 20

export const arucoProcess= (canvas, settings) => {
    const context= canvas.getContext('2d');
    const model_size = settings.toolVideoOMRMarkerSize || DEFAULT_MODEL_SIZE;
    const detector = new AR.Detector();
    
    
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let markers = detector.detect(imageData);

    drawCorners(markers,canvas);
    let pose = getPose(markers,model_size,canvas);
    if (pose) drawPose(pose.bestError, pose.bestRotation, pose.bestTranslation,canvas);

    return canvas;
    
}

const drawCorners = (markers, canvas)=> {
    const context= canvas.getContext('2d');
    var corners, corner, i, j;

    context.lineWidth = 3;
    for (i = 0; i < markers.length; ++ i){
        corners = markers[i].corners;
        
        context.strokeStyle = "red";
        context.beginPath();
        
        for (j = 0; j < corners.length; ++ j){
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }
        context.stroke();
        context.closePath();
        
        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);

        context.fillStyle = "blue";
        context.font="30px Arial";
        context.fillText(markers[i].id, corners[0].x, corners[0].y)
    }
    context.save();
};

const getPose = (markers, model_size, canvas)=>{
    const posit = new POS.Posit(model_size, canvas.width);
    var corners, corner, pose, i;
    if (markers.length > 0){
        corners = markers[0].corners;
        for (i = 0; i < corners.length; ++ i){
          corner = corners[i];
          corner.x = corner.x - (canvas.width / 2);
          corner.y = (canvas.height / 2) - corner.y;
        }
        return posit.pose(corners);
    }
    return null;
}

function drawPose(error, rotation, translation,canvas){
    var yaw = -Math.atan2(rotation[0][2], rotation[2][2]);
    var pitch = -Math.asin(-rotation[1][2]);
    var roll = Math.atan2(rotation[1][0], rotation[1][1]);

    let data = {
        x: translation[0] | 0,
        y: translation[1] | 0,
        z: translation[2] | 0,
        yaw: Math.round(-yaw * 180.0/Math.PI),
        pitch: Math.round(-pitch * 180.0/Math.PI),
        roll:  Math.round(roll * 180.0/Math.PI)
    }

    const context = canvas.getContext('2d');

    context.fillStyle="fuchsia";
    context.font="20px Arial";
    context.fillText(`x: ${data.x}, y: ${data.y}, z: ${data.z}`, 0,20);
    context.fillText(`yaw: ${data.yaw}, pitch: ${data.pitch}, roll: ${data.roll}`, 0,40);
    
};