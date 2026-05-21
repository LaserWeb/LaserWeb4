// Copyright 2016 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { createContext, useContext } from 'react';

import { convertOutlineToThickLines } from '../draw-commands/thick-lines'
import { filterClosedRawPaths, triangulateRawPaths } from '../lib/mesh';

function updateCachedDocument(cachedDocument, drawCommands) {
    let numImagesLoaded = 0;
    let { document } = cachedDocument;
    if (document.rawPaths) {
        if (cachedDocument.rawPaths !== document.rawPaths) {
            cachedDocument.rawPaths = document.rawPaths;
            try {
                cachedDocument.triangles = new Float32Array(triangulateRawPaths(filterClosedRawPaths(document.rawPaths)));
            } catch (e) {
                console.log(e);
                cachedDocument.triangles = new Float32Array(0);
            }
            cachedDocument.outlines = [];
            cachedDocument.thickOutlines = [];
            cachedDocument.bounds = null;
            for (let rawPath of document.rawPaths) {
                cachedDocument.outlines.push(new Float32Array(rawPath));
                let thick = convertOutlineToThickLines(rawPath);
                if (thick) {
                    cachedDocument.thickOutlines.push(thick);
                }
            }
        }
        let t = document.transform2d;
        let ct = cachedDocument.transform2d;
        if (!cachedDocument.bounds || !ct || ct[0] != t[0] || ct[1] != t[1] || ct[2] != t[2] || ct[3] != t[3]) {
            let bounds = cachedDocument.bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
            for (let rawPath of document.rawPaths) {
                for (let i = 0; i < rawPath.length - 1; i += 2) {
                    let x = t[0] * rawPath[i] + t[2] * rawPath[i + 1];
                    let y = t[1] * rawPath[i] + t[3] * rawPath[i + 1];
                    bounds.x1 = Math.min(bounds.x1, x);
                    bounds.x2 = Math.max(bounds.x2, x);
                    bounds.y1 = Math.min(bounds.y1, y);
                    bounds.y2 = Math.max(bounds.y2, y);
                }
            }
            cachedDocument.transform2d = document.transform2d;
        }
    } else if (document.type === 'image') {
        let updateTexture = () => {
            if (drawCommands && cachedDocument.imageLoaded && (!cachedDocument.texture || cachedDocument.drawCommands !== drawCommands)) {
                if (cachedDocument.texture) {
                    cachedDocument.texture.destroy();
                }
                cachedDocument.drawCommands = drawCommands;
                cachedDocument.texture = drawCommands.createTexture({ image: cachedDocument.image });
            }
            if (cachedDocument.texture) {
                let t = document.transform2d;
                let w = cachedDocument.image.width;
                let h = cachedDocument.image.height;
                let tx = (x, y) => t[0] * x + t[2] * y;
                let ty = (x, y) => t[1] * x + t[3] * y;
                cachedDocument.bounds = {
                    x1: Math.min(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
                    y1: Math.min(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h)),
                    x2: Math.max(tx(0, 0), tx(w, 0), tx(w, h), tx(0, h)),
                    y2: Math.max(ty(0, 0), ty(w, 0), ty(w, h), ty(0, h)),
                };
            }
        }

        if (cachedDocument.dataURL !== document.dataURL) {
            cachedDocument.dataURL = document.dataURL;
            cachedDocument.texture = null;
            cachedDocument.imageLoaded = false;
            let image = cachedDocument.image = new Image();
            cachedDocument.image.src = document.dataURL;
            cachedDocument.image.onload = () => {
                if (cachedDocument.image === image) {
                    cachedDocument.imageLoaded = true;
                    ++numImagesLoaded;
                    updateTexture();
                }
            }
        } else {
            updateTexture();
        }
    }

    return numImagesLoaded; // FIXME(REFACTOR): Temporary, until we refactor and can test this implementation itself
}

let documentCacheContext = createContext();
let lastHitTestId = 0;

// * This holds document data which
//   * doesn't belong in the store,
//   * is computed from data in the store, and
//   * is too expensive to recompute every render.
// FIXME(REFACTOR): Can this be replaced entirely with useMemo usage?
export function DocumentCacheHolder({ documents, children, ... rest }) {
    // HACK
    let contextAPI = React.useMemo(() => ({
        cache: new Map(),
        numImagesLoaded: 0,
        drawCommands: undefined, // Mutated from within <Workspace />
    }), []);

    React.useEffect(() => {
        // TODO(REFACTOR): This entire callback, this could surely be more readable?
        let oldCache = contextAPI.cache;
        contextAPI.cache = new Map();
        for (let cachedDocument of oldCache.values()) {
            cachedDocument.used = false;
        }
        for (let document of documents) {
            let cachedDocument = oldCache.get(document.id);
            if (cachedDocument) {
                cachedDocument.document = document;
            } else {
                cachedDocument = { id: document.id, document, hitTestId: ++lastHitTestId };
            }
            cachedDocument.used = true;
            contextAPI.numImagesLoaded += updateCachedDocument(cachedDocument, contextAPI.drawCommands); // TODO(REFACTOR): Should this trigger a re-render?
            contextAPI.cache.set(document.id, cachedDocument);
        }
        for (let cachedDocument of oldCache.values()) {
            if (!cachedDocument.used) {
                cachedDocument.image = null;
                cachedDocument.drawCommands = null;
                if (cachedDocument.texture) {
                    cachedDocument.texture.destroy();
                }
            }
        }
    }, [ documents, contextAPI ]);

    // FIXME(REFACTOR): Do we actually need the wrapper div here, or is that just an artifact of the old React Context API's limitations?
    return <documentCacheContext.Provider value={contextAPI}>
        <div { ... rest }>
            {children}
        </div>
    </documentCacheContext.Provider>;
}

export function withDocumentCache(Component) {
    return function DocumentCacheWrapper(props) {
        let documentCacheHolder = useContext(documentCacheContext);
        return <Component {... props} documentCacheHolder={documentCacheHolder} />
    }
}

export { documentCacheContext };
