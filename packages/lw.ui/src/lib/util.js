"use strict";

export function objectHasMatchingFields(obj, fields) {
    for (let key in fields)
        if (fields.hasOwnProperty(key) && obj[key] !== fields[key])
            return false;
    return true;
}

export function sameArrayContent(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i])
}
