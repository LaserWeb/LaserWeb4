import { setAttrs } from '../actions/object'

export const setCameraAttrs = setAttrs('camera');

export function resetCamera() {
    return { type: 'CAMERA_RESET' };
}
