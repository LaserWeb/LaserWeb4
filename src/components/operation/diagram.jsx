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

import { useEffect, useMemo, useState } from 'react'
import Snap from 'snapsvg-cjs';

const hide = [
    'LaserCut',
    'LaserCutInside',
    'LaserCutOutside',
    'LaserRaster',
    'LaserFill',
    'MillPocket',
    'MillCut',
    'MillCutInside',
    'MillCutOutside',
    'MillVCarve',
    'PlasmaInside',
    'PlasmaOutside',
    'CW',
    'CCW',
    'toolDia',
    'laserDia',
    'toolAngle',
    'lineSpace',
    'millRapidZ',
    'cutDirection',
    'zStep',
    'millStartZ',
    'millEndZ',
];

const types = {
    'Laser Cut': { show: ['LaserCut'] },
    'Laser Cut Inside': { show: ['LaserCutInside', 'laserDia'] },
    'Laser Cut Outside': { show: ['LaserCutOutside', 'laserDia'] },
    'Laser Fill Path': { show: ['LaserFill', 'lineSpace'] },
    'Laser Raster': { show: ['LaserRaster', 'laserDia'] },
    'Laser Raster Merge': { show: ['LaserRaster', 'laserDia'] },
    'Mill Pocket': { show: ['MillPocket', 'toolDia', 'millRapidZ', 'zStep', 'millStartZ', 'millEndZ'] },
    'Mill Cut': { show: ['MillCut', 'toolDia', 'millRapidZ', 'zStep', 'millStartZ', 'millEndZ'] },
    'Mill Cut Inside': { show: ['MillCutInside', 'toolDia', 'millRapidZ', 'zStep', 'millStartZ', 'millEndZ'] },
    'Mill Cut Outside': { show: ['MillCutOutside', 'toolDia', 'millRapidZ', 'zStep', 'millStartZ', 'millEndZ'] },
    'Mill V Carve': { show: ['MillVCarve', 'toolAngle', 'millStartZ', 'millRapidZ', 'zStep'] },
};

function changeSVGForOperation(op) {
    // FIXME(REFACTOR): This should be scoped to the SVG element, not the whole document!
    for (let id of hide) {
        document.getElementById(id).style.display = 'none';
    }
    
    if (!op) {
        return;
    }
    let type = types[op.type];
    if (!type) {
        return;
    }
    for (let id of type.show) {
        document.getElementById(id).style.display = 'inline';
    }

    document.getElementById('Labels').style.display = 'inline';
    document.getElementById('laserDia').textContent = op.laserDiameter + 'mm Diameter';
    document.getElementById('toolDia').textContent = op.toolDiameter + 'mm Diameter';
    document.getElementById('millRapidZ').textContent = op.millRapidZ + 'mm Rapid Z';
    document.getElementById('lineSpace').textContent = op.lineDistance + 'mm Spacing';
    document.getElementById('toolAngle').textContent = op.toolAngle + '\u00B0 Angle';
    document.getElementById('zStep').textContent = op.passDepth + 'mm per pass';
    document.getElementById('millStartZ').textContent = op.millStartZ + 'mm Start Z';
    document.getElementById('millEndZ').textContent = op.millEndZ + 'mm End Z';

    if (op.type == 'Mill Cut' || op.type == 'Mill Cut Outside') {
        if (op.direction == 'Conventional') {
            document.getElementById('CCW').style.display = 'inline';
        } else if (op.direction == 'Climb') {
            document.getElementById('CW').style.display = 'inline';
        }
    }

    if (op.type == 'Mill Cut Inside') {
        if (op.direction == 'Conventional') {
            document.getElementById('CW').style.display = 'inline';
        } else if (op.direction == 'Climb') {
            document.getElementById('CCW').style.display = 'inline';
        }
    }
}

export function OperationDiagram({ operations, currentOperation }) {
    let [ containerNode, setContainerNode ] = useState();
    let [ svgDOM, setSVGDOM ] = useState();
    let op = useMemo(() => operations.find(op => op.id === currentOperation), [ operations, currentOperation ]);

    useEffect(() => {
        // FIXME(REFACTOR): This seems very convoluted and could probably be simplified by a lot
        fetch('cnctoolpath.svg')
            .then(resp => resp.text())
            .then(content => {
                // FIXME: Why do we need to use SnapSVG here? Why not just the browser's native SVG support?
                let parsed = Snap.parse(content).select('svg').node;
                parsed.style.width = '100%';
                parsed.style.height = 'inherit';
                setSVGDOM(parsed);
            });
    }, []);

    useEffect(() => {
        if (containerNode != null && svgDOM != null) {
            containerNode.appendChild(svgDOM);
            return () => containerNode.removeChild(svgDOM);
        }
    }, [ containerNode, svgDOM ]);

    useEffect(() => {
        if (containerNode != null && svgDOM != null) {
            changeSVGForOperation(op);
        }
    }, [ containerNode, svgDOM, op ]);

    let visible = currentOperation != null && operations.length > 0;
    return <div ref={setContainerNode} style={{ transition: "height 0.25s ease-in", height: visible ? 100 : 0 }} />;
}
