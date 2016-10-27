import { objectNoId } from '../reducers/object'

export const camera = objectNoId('camera', resetCamera(null, { machineWidth: 300, machineHeight: 300 }));

export function resetCamera(camera, settings) {
    return {
        eye: [settings.machineWidth / 2, settings.machineHeight / 2, Math.max(settings.machineWidth, settings.machineHeight) / Math.sqrt(2)],
        center: [settings.machineWidth / 2, settings.machineHeight / 2, 0],
        up: [0, 1, 0],
    };
}
