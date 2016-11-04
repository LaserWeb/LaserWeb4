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

import { triangulatePositions } from '../lib/mesh';

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
            for (let document of documents) {
                let cachedDocument = oldCache.get(document.id);
                if (cachedDocument)
                    cachedDocument.document = document;
                else
                    cachedDocument = { id: document.id, document, hitTestId: ++this.lastHitTestId };
                this.update(cachedDocument);
                this.cache.set(document.id, cachedDocument);
            }
        }
    }

    update(cachedDocument) {
        let {document} = cachedDocument;
        switch (document.type) {
            case 'path':
                if (cachedDocument.positions !== document.positions) {
                    cachedDocument.positions = document.positions;
                    cachedDocument.triangles = new Float32Array(triangulatePositions(document.positions, 0));
                    cachedDocument.outlines = [];
                    for (let p of document.positions)
                        cachedDocument.outlines.push(new Float32Array(p));
                }
                break;
            case 'image': {
                let updateTexture = () => {
                    if (this.regl && cachedDocument.imageLoaded && (!cachedDocument.texture || cachedDocument.regl !== this.regl)) {
                        cachedDocument.regl = this.regl;
                        cachedDocument.texture = this.regl.texture(cachedDocument.image);
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
                break;
            }
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
                <Component {...{...this.props, documentCacheHolder: this.context.documentCacheHolder }} />
            );
        }
    };
    Wrapper.contextTypes = {
        documentCacheHolder: React.PropTypes.any,
    };
    return Wrapper;
}
