import { objectNoId } from '../reducers/object'

export const camera = objectNoId('camera', resetCamera(null, { machineWidth: 300, machineHeight: 300 }));

export function resetCamera(camera, settings) {
    return {
        eye: [settings.machineWidth / 2, settings.machineHeight / 2, Math.max(settings.machineWidth, settings.machineHeight)],
        center: [settings.machineWidth / 2, settings.machineHeight / 2, 0],
        up: [0, 1, 0],
        fovy: Math.PI / 2.6,
        showPerspective: false,
    };
}

export function zoomArea(camera, settings, workspace, { x1, y1, x2, y2 }) {
    let d = 300;
    let cx = (x1 + x2) / 2 - settings.machineBottomLeftX + workspace.workOffsetX;
    let cy = (y1 + y2) / 2 - settings.machineBottomLeftY + workspace.workOffsetY;
    let fovy = 2 * Math.atan2(Math.max(Math.abs(y2 - y1), Math.abs(x2 - x1) * workspace.height / workspace.width) / 2, d);
    return {
        eye: [cx, cy, d],
        center: [cx, cy, 0],
        up: [0, 1, 0],
        fovy,
        showPerspective: false,
    };
}
