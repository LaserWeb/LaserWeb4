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

import React from 'react'
import ReactDOM from 'react-dom'
import Snap from 'snapsvg';

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

export class OperationDiagram extends React.Component {
    componentWillMount() {
        fetch('cnctoolpath.svg')
            .then(resp => resp.text())
            .then(content => {
                this.svg = Snap.parse(content).select('svg').node;
                this.svg.style.width = '100%';
                this.svg.style.height = 'inherit';
                ReactDOM.findDOMNode(this).appendChild(this.svg);
                this.updateSvg();
            });
    }

    updateSvg(props) {
        let { operations, currentOperation } = this.props;
        if (!this.svg)
            return;
        for (let id of hide)
            document.getElementById(id).style.display = 'none';
        let op = operations.find(op => op.id === currentOperation);
        if (!op)
            return;
        let type = types[op.type];
        if (!type)
            return;
        for (let id of type.show)
            document.getElementById(id).style.display = 'inline';
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

    render() {
        this.updateSvg();
        let visible = this.props.currentOperation && this.props.operations.length;
        return <div style={{ transition: "height 0.25s ease-in", height: visible ? 100 : 0 }} />;
    }
};
