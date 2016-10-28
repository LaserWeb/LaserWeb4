"use strict";

import { object, objectArray } from '../reducers/object'

export const operation = object('operation', {
    documents: [],
});

export const operations = objectArray('operation', operation);
