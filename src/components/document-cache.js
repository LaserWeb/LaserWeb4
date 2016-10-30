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

// * This holds document data which
//   * doesn't belong in the store,
//   * is computed from data in the store, and
//   * is too expensive to recompute every render.
// * This maintains the cache's structure; other 
//   components fill in the data.  
export class DocumentCacheHolder extends React.Component {
    constructor() {
        super();
        this.cache = new Map();
    }

    getChildContext() {
        return { documentCacheHolder: this };
    }

    componentWillReceiveProps(nextProps) {
        if (this.documents !== nextProps.documents) {
            this.documents = nextProps.documents;
            let oldCache = this.cache;
            this.cache = new Map();
            for (let document of nextProps.documents)
                this.cache.set(document.id, oldCache.get(document.id) || {});
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
