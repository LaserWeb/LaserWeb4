"use strict";

import { objectNoId } from '../reducers/object'

export const workspace = objectNoId('workspace', {
    g0Rate: 1000,
    simTime: 1e10,
    showDocuments: true,
});
