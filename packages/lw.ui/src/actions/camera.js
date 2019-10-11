import { setAttrs } from '../actions/object'

export const setCameraAttrs = setAttrs('camera');

export function zoomArea(x1, y1, x2, y2) {
    return { type: 'CAMERA_ZOOM_AREA', x1, y1, x2, y2 };
}
