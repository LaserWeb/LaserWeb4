import { objectNoId } from '../reducers/object'

export const camera = objectNoId('camera', {
    eye: [150, 150, 200],
    center: [150, 150, 0],
    up: [0, 1, 0],
});
