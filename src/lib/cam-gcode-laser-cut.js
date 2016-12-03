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

'use strict';

import { dist, cut, insideOutside, pocket, separateTabs, vCarve } from './cam';
import { mmToClipperScale, offset, rawPathsToClipperPaths, union } from './mesh';

// Convert laser cut paths to gcode.
//      paths:          Array of CamPath
//      scale:          Factor to convert Clipper units to gcode units
//      offsetX:        Offset X (gcode units)
//      offsetY:        Offset Y (gcode units)
//      decimal:        Number of decimal places to keep in gcode
//      cutFeed:        Feedrate for horizontal cuts (gcode units)
//      laserPower:     [0, 100]
//      passes:         Number of passes
//      tabGeometry:    Tab geometry
//      gcodeLaserOn:   Laser on (may be empty)
//      gcodeLaserOff:  Laser off (may be empty)
//      gcodeSMaxValue: Max S value
export function getLaserCutGcode(props) {
    let {paths, scale, offsetX, offsetY, decimal, cutFeed, laserPower, passes,
        tabGeometry, gcodeLaserOn, gcodeLaserOff, gcodeSMaxValue} = props;

    let laserOn = '; Laser On\r\n';
    if (gcodeLaserOn)
        laserOn += gcodeLaserOn + '\r\n';
    laserOn += 'S' + (gcodeSMaxValue * laserPower / 100) + '\r\n';

    let laserOff = '; Laser Off\r\n';
    if (gcodeLaserOn)
        laserOff += gcodeLaserOff + '\r\n';
    laserOff += 'S0\r\n';

    function convertPoint(p) {
        return ' X' + (p.X * scale + offsetX).toFixed(decimal) + ' Y' + (p.Y * scale + offsetY).toFixed(decimal);
    }

    let gcode = '';
    for (let pass = 0; pass < passes; ++pass) {
        gcode += '\n\n; Pass ' + pass + '\r\n';
        for (let pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
            let path = paths[pathIndex].path;
            if (path.length === 0)
                continue;
            gcode += '\r\n; Pass ' + pass + ' Path ' + pathIndex + '\r\n';

            let separatedPaths = separateTabs(path, tabGeometry);
            for (let selectedIndex = 0; selectedIndex < separatedPaths.length; ++selectedIndex) {
                let selectedPath = separatedPaths[selectedIndex];
                if (selectedPath.length === 0)
                    continue;
                if (selectedIndex & 1) {
                    gcode += '; Skip tab\r\n';
                    continue;
                }
                gcode += 'G0' + convertPoint(selectedPath[0]) + '\r\n';
                gcode += laserOn;
                for (let i = 1; i < selectedPath.length; ++i) {
                    gcode += 'G1' + convertPoint(selectedPath[i]);
                    if (i == 1)
                        gcode += ' F' + cutFeed;
                    gcode += '\r\n';
                }
                gcode += laserOff;
            }
        }
    }

    return gcode;
}; // getLaserCutGcode

export function getLaserCutGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert) {
    let ok = true;

    if (settings.gcodeSMaxValue <= 0) {
        showAlert("PWM Max S Value (in Settings) must be greater than 0", "alert-danger");
        ok = false;
    }
    if (op.type !== 'Laser Cut') {
        if (op.laserDiameter <= 0) {
            showAlert("Laser Diameter must be greater than 0", "alert-danger");
            ok = false;
        }
    }
    if (op.laserPower < 0 || op.laserPower > 100) {
        showAlert("Laser Power must be in range [0, 100]", "alert-danger");
        ok = false;
    }
    if (op.passes <= 0 || (op.passes | 0) !== +op.passes) {
        showAlert("Passes must be integer > 0", "alert-danger");
        ok = false;
    }
    if (op.cutRate <= 0) {
        showAlert("Cut Rate must be greater than 0", "alert-danger");
        ok = false;
    }
    if (!ok)
        return '';

    let camPaths = [];
    if (op.type === 'Laser Cut') {
        camPaths = cut(geometry, openGeometry, false);
    } else if (op.type === 'Laser Cut Inside') {
        if (op.margin)
            geometry = offset(geometry, -op.margin * mmToClipperScale);
        camPaths = insideOutside(geometry, op.laserDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', false);
    } else if (op.type === 'Laser Cut Outside') {
        if (op.margin)
            geometry = offset(geometry, op.margin * mmToClipperScale);
        camPaths = insideOutside(geometry, op.laserDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', false);
    }

    let gcode =
        "\r\n;" +
        "\r\n; Operation:    " + opIndex +
        "\r\n; Type:         " + op.type +
        "\r\n; Paths:        " + camPaths.length +
        "\r\n; Passes:       " + op.passes +
        "\r\n; Cut rate:     " + op.cutRate +
        "\r\n;\r\n";

    gcode += getLaserCutGcode({
        paths: camPaths,
        scale: 1 / mmToClipperScale,
        offsetX: 0,
        offsetY: 0,
        decimal: 4,
        cutFeed: op.cutRate,
        laserPower: op.laserPower,
        passes: op.passes,
        tabGeometry: tabGeometry,
        gcodeLaserOn: settings.gcodeLaserOn,
        gcodeLaserOff: settings.gcodeLaserOff,
        gcodeSMaxValue: settings.gcodeSMaxValue,
    });

    return gcode;
} // getLaserCutGcodeFromOp
