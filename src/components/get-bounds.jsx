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

import { createContext, useContext } from 'react';
import useBounds from '../hooks/use-bounds';

let boundsContext = createContext();
export { boundsContext };

// FIXME(REFACTOR): This currently uses two entirely separate mechanisms to pass down bounds; prop injection and context. Need to reconcile these into one.
export function GetBounds({ Type, setBoundsProp, children, ... rest }) {
    let [ boundsRef, bounds ] = useBounds();
    
    if (setBoundsProp) {
        rest.bounds = bounds;
    }

    /* NOTE: If the Type is a component, the component is responsible for internally attaching the `ref` to the appropriate DOM node */
    return <boundsContext.Provider value={bounds}>
        <Type ref={boundsRef} {... rest}>
            {children}
        </Type>
    </boundsContext.Provider>;
}

export function withGetBounds(Component) {
    return function LocalBoundsInjectionWrapper(props) {
        /* This also passes in `children`, since that's just another prop */
        return <GetBounds {... props} Type={Component} setBoundsProp={true} />;
    };
}

export function withStoredBounds(Component) {
    return function ContextBoundsInjectionWrapper(props) {
        let bounds = useContext(boundsContext);
        
        return <Component {... props} bounds={bounds} />;
    };
}
