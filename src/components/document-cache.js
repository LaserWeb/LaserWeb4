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

import React from 'react';

import { convertOutlineToThickLines } from '../draw-commands/thick-lines'
import { filterClosedRawPaths, triangulateRawPaths } from '../lib/mesh';

// * This holds document data which
//   * doesn't belong in the store,
//   * is computed from data in the store, and
//   * is too expensive to recompute every render.
export class DocumentCacheHolder extends React.Component {
    constructor() {
        super();
        this.cache = new Map();
        this.lastHitTestId = 0;
    }

    getChildContext() {
        return { documentCacheHolder: this };
    }

    componentWillMount() {
        this.setDocuments(this.props.documents);
    }

    componentWillReceiveProps(nextProps) {
        this.setDocuments(nextProps.documents);
    }

    setDocuments(documents) {
        if (this.documents !== documents) {
            this.documents = documents;
            let oldCache = this.cache;
            this.cache = new Map();
            for (let cachedDocument of oldCache.values())
                cachedDocument.used = false;
            for (let document of documents) {
                let cachedDocument = oldCache.get(document.id);
                if (cachedDocument)
                    cachedDocument.document = document;
                else
                    cachedDocument = { id: document.id, document, hitTestId: ++this.lastHitTestId };
                cachedDocument.used = true;
                this.update(cachedDocument);
                this.cache.set(document.id, cachedDocument);
            }
            for (let cachedDocument of oldCache.values()) {
                if (!cachedDocument.used) {
                    cachedDocument.image = null;
                    cachedDocument.drawCommands = null;
                    if (cachedDocument.texture)
                        cachedDocument.texture.destroy();
                }
            }
        }
    }

    update(cachedDocument) {
        let {document} = cachedDocument;
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
                let bounds = cachedDocument.bounds = { x1: Number.MAX_VALUE, y1: Number.MAX_VALUE, x2: -Number.MAX_VALUE, y2: -Number.MAX_VALUE };
                for (let rawPath of document.rawPaths) {
                    for (let i = 0; i < rawPath.length - 1; i += 2) {
                        bounds.x1 = Math.min(bounds.x1, rawPath[i]);
                        bounds.x2 = Math.max(bounds.x2, rawPath[i]);
                        bounds.y1 = Math.min(bounds.y1, rawPath[i + 1]);
                        bounds.y2 = Math.max(bounds.y2, rawPath[i + 1]);
                    }
                    cachedDocument.outlines.push(new Float32Array(rawPath));
                    let thick = convertOutlineToThickLines(rawPath);
                    if (thick)
                        cachedDocument.thickOutlines.push(thick);
                }
            }
        } else if (document.type === 'image') {
            let updateTexture = () => {
                if (this.drawCommands && cachedDocument.imageLoaded && (!cachedDocument.texture || cachedDocument.drawCommands !== this.drawCommands)) {
                    if (cachedDocument.texture)
                        cachedDocument.texture.destroy();
                    cachedDocument.drawCommands = this.drawCommands;
                    cachedDocument.texture = this.drawCommands.createTexture({ image: cachedDocument.image });
                    cachedDocument.bounds = {
                        x1: 0,
                        y1: 0,
                        x2: cachedDocument.image.width / document.dpi * 25.4,
                        y2: cachedDocument.image.height / document.dpi * 25.4
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
                        updateTexture();
                    }
                }
            }
            else
                updateTexture();
        }
    }

    render() {
        let p = { ...this.props };
        delete p.documents;
        return (
            <div {...p}>
                {this.props.children}
            </div >
        );
    }
};
DocumentCacheHolder.childContextTypes = {
    documentCacheHolder: React.PropTypes.any,
};

export function withDocumentCache(Component) {
    class Wrapper extends React.Component {
        render() {
            return (
                <Component {...{ ...this.props, documentCacheHolder: this.context.documentCacheHolder }} />
            );
        }
    };
    Wrapper.contextTypes = {
        documentCacheHolder: React.PropTypes.any,
    };
    return Wrapper;
}
