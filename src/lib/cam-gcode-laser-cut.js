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

import { dist, cut, fillPath, insideOutside, pocket, reduceCamPaths, separateTabs, vCarve } from './cam';
import { mmToClipperScale, offset, rawPathsToClipperPaths, union } from './mesh';
import { getGenerator } from "./action2gcode/gcode-generator";

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
//      gcodeToolOn:   Laser on (may be empty)
//      gcodeToolOff:  Laser off (may be empty)
//      gcodeSMaxValue: Max S value
export function getLaserCutGcode(props) {
    let { paths, generator, scale, offsetX, offsetY, decimal, cutFeed, laserPower, laserHasIntensity, passes,
        useA, aAxisDiameter,
        tabGeometry, gcodeToolOn, gcodeToolOff,
        gcodeLaserIntensity, gcodeLaserIntensitySeparateLine, gcodeSMinValue, gcodeSMaxValue,
        useZ, useBlower,
        hookPassStart, hookPassEnd
    } = props;

    if (gcodeToolOn)
        gcodeToolOn += '\r\n';
    if (gcodeToolOff)
        gcodeToolOff += '\r\n';
    let laserOnS = gcodeLaserIntensity + (gcodeSMinValue + (gcodeSMaxValue - gcodeSMinValue) * laserPower / 100).toFixed(decimal);

    let lastX = 0, lastY = 0, lastA = 0;
    function convertPoint(p, rapid) {
        let x = p.X * scale + offsetX;
        let y = p.Y * scale + offsetY;
        if (useA) {
            let a = y * 360 / aAxisDiameter / Math.PI;
            let roundedX = Number(x.toFixed(decimal));
            let roundedA = Number(a.toFixed(decimal));
            let adjustedY = roundedA * aAxisDiameter * Math.PI / 360;
            if (rapid) {
                lastX = roundedX;
                lastY = adjustedY;
                lastA = roundedA;
              //return 'G0 X' + x.toFixed(decimal) + ' A' + a.toFixed(decimal);
              return {x: x.toFixed(decimal), a: a.toFixed(decimal)};
            } else {
                let dx = roundedX - lastX, dy = adjustedY - lastY, da = roundedA - lastA;
                let travelTime = Math.sqrt(dx * dx + dy * dy) / cutFeed;
                let f = 0;
                if (dx)
                    f = Math.abs(dx) / travelTime;
                else if (da)
                    f = Math.abs(da) / travelTime;
                else
                    return null;
                    //return '';
                lastX = roundedX;
                lastY = adjustedY;
                lastA = roundedA;
                return {x: x.toFixed(decimal), a: a.toFixed(decimal), f: f.toFixed(decimal)};
                //return 'G1 X' + x.toFixed(decimal) + ' A' + a.toFixed(decimal) + ' F' + f.toFixed(decimal);
            }
        } else {
            return {x: x.toFixed(decimal), y: y.toFixed(decimal)};
            /*if (rapid)
                return 'G0 X' + x.toFixed(decimal) + ' Y' + y.toFixed(decimal);
            else
                return 'G1 X' + x.toFixed(decimal) + ' Y' + y.toFixed(decimal);*/
        }
    }

    let gcode = '';

    for (let pass = 0; pass < passes; ++pass) {

        if (hookPassStart) gcode += hookPassStart;

        gcode += '\n\n; Pass ' + pass + '\r\n';

        if (useBlower) {
            if (useBlower.blowerOn) {
                gcode += `${useBlower.blowerOn}; Enable Air assist\r\n`;
            }
        }

        let usedZposition = false;
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
                gcode += generator.moveRapid(convertPoint(selectedPath[0], true)) + '\r\n';

                if (useZ && !usedZposition) {
                    usedZposition = true;
                    let zHeight = useZ.startZ + useZ.offsetZ - (useZ.passDepth * pass);
                    gcode += `; Pass Z Height ${zHeight}mm (Offset: ${useZ.offsetZ}mm)\r\n`;
                    gcode += 'G0 Z' + zHeight.toFixed(decimal) + '\r\n\r\n';
                }
                gcode += generator.toolOn(gcodeToolOn, {i:laserOnS});

                for (let i = 1; i < selectedPath.length; ++i) {
                    if (i == 1 && gcodeLaserIntensitySeparateLine && laserHasIntensity)
                        gcode += laserOnS + '\n';
                    let action = convertPoint(selectedPath[i], false);
                    //gcode += convertPoint(selectedPath[i], false);
                    if (i == 1 && !gcodeLaserIntensitySeparateLine && laserHasIntensity)
                        action.i = laserOnS;
                        //gcode += ' ' + laserOnS;
                    if (i == 1 && !useA)
                        action.f = cutFeed;
                        //gcode += ' F' + cutFeed;
                    gcode += generator.moveTool(action);
                    gcode += '\r\n';
                }

                gcode += generator.toolOff(gcodeToolOff, {i:laserOnS});
            }
        }


        if (useBlower) {
            if (useBlower.blowerOff) {
                gcode += `${useBlower.blowerOff}; Disable Air assist\r\n`;
            }
        }

        if (hookPassEnd) gcode += hookPassEnd;

    }

    return gcode;
}; // getLaserCutGcode

export function getLaserCutGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
    let ok = true;

    if (op.type !== 'Laser Cut' && op.type !== 'Laser Fill Path') {
        if (op.laserDiameter <= 0) {
            showAlert("Laser Diameter must be greater than 0", "danger");
            ok = false;
        }
    }
    if (op.type === 'Laser Fill Path') {
        if (op.lineDistance <= 0) {
            showAlert("Line Distance must be greater than 0", "danger");
            ok = false;
        }
    }
    if (op.laserPower < 0 || op.laserPower > 100) {
        showAlert("Laser Power must be in range [0, 100]", "danger");
        ok = false;
    }
    if (op.passes <= 0 || (op.passes | 0) !== +op.passes) {
        showAlert("Passes must be integer > 0", "danger");
        ok = false;
    }
    if (op.cutRate <= 0) {
        showAlert("Cut Rate must be greater than 0", "danger");
        ok = false;
    }
    if (op.useA) {
        if (op.aAxisDiameter <= 0) {
            showAlert("A axis diameter must be greater than 0", "danger");
            ok = false;
        }
    }

    if (settings.machineZEnabled) {
        if (op.startHeight === "" || isNaN(op.startHeight)) {
            showAlert("Start Height must be a valid number", "danger");
            ok = false;
        }
    }

    if (!ok) {
        done(false);
    }

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
    } else if (op.type === 'Laser Fill Path') {
        if (op.margin)
            geometry = offset(geometry, -op.margin * mmToClipperScale);
        camPaths = fillPath(geometry, op.lineDistance * mmToClipperScale, op.lineAngle);
    }

    reduceCamPaths(camPaths, op.segmentLength * mmToClipperScale);

    let feedScale = 1;
    if (settings.toolFeedUnits === 'mm/s')
        feedScale = 60;

    let gcode =
        "\r\n;" +
        "\r\n; Operation:    " + opIndex +
        "\r\n; Type:         " + op.type +
        "\r\n; Paths:        " + camPaths.length +
        "\r\n; Passes:       " + op.passes +
        "\r\n; Cut rate:     " + op.cutRate + ' ' + settings.toolFeedUnits +
        (settings.machineLaserHasIntensity ? "" : "\r\n; Laser intensity output (S) disabled in settings") +
        "\r\n;\r\n";

    if (op.hookOperationStart.length) gcode += op.hookOperationStart;

    let generator = getGenerator(settings.gcodeGenerator, settings);

    gcode += getLaserCutGcode({
        generator: generator,
        paths: camPaths,
        scale: 1 / mmToClipperScale,
        offsetX: 0,
        offsetY: 0,
        decimal: 2,
        cutFeed: op.cutRate * feedScale,
        laserPower: op.laserPower,
        laserHasIntensity: settings.machineLaserHasIntensity,
        passes: op.passes,
        useA: op.useA,
        useZ: settings.machineZEnabled ? {
            startZ: Number(op.startHeight),
            offsetZ: settings.machineZToolOffset,
            passDepth: op.passDepth,
        } : false,
        useBlower: op.useBlower ? {
            blowerOn: settings.machineBlowerGcodeOn,
            blowerOff: settings.machineBlowerGcodeOff,
        } : false,
        aAxisDiameter: op.aAxisDiameter,
        tabGeometry: tabGeometry,
        gcodeToolOn: settings.gcodeToolOn,
        gcodeToolOff: settings.gcodeToolOff,
        gcodeLaserIntensity: settings.gcodeLaserIntensity,
        gcodeLaserIntensitySeparateLine: settings.gcodeLaserIntensitySeparateLine,
        gcodeSMinValue: settings.gcodeSMinValue,
        gcodeSMaxValue: settings.gcodeSMaxValue,

        hookPassStart: op.hookPassStart,
        hookPassEnd: op.hookPassEnd,
    });

    if (op.hookOperationEnd.length) gcode += op.hookOperationEnd;

    done(gcode)

} // getLaserCutGcodeFromOp
