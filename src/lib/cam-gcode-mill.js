// Copyright 2014, 2016 Todd Fleming
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

import { dist, cut, insideOutside, pocket, reduceCamPaths, separateTabs, vCarve } from './cam';
import { mmToClipperScale, offset, rawPathsToClipperPaths, union } from './mesh';

// Convert mill paths to gcode.
//      paths:          Array of CamPath
//      ramp:           Ramp these paths?
//      scale:          Factor to convert Clipper units to gcode units
//      useZ:           Use Z coordinates in paths? (defaults to false, used for vPocket)
//      offsetX:        Offset X (gcode units)
//      offsetY:        Offset Y (gcode units)
//      decimal:        Number of decimal places to keep in gcode
//      topZ:           Top of area to cut (gcode units)
//      botZ:           Bottom of area to cut (gcode units)
//      safeZ:          Z position to safely move over uncut areas (gcode units)
//      passDepth:      Cut depth for each pass (gcode units)
//      plungeFeed:     Feedrate to plunge cutter (gcode units)
//      cutFeed:        Feedrate for horizontal cuts (gcode units)
//      tabGeometry:    Tab geometry (optional)
//      tabZ:           Z position over tabs (required if tabGeometry is not empty) (gcode units)
export function getMillGcode(props) {
    let {paths, ramp, scale, useZ, offsetX, offsetY, decimal, topZ, botZ, safeZ, passDepth,
        plungeFeed, cutFeed, tabGeometry, tabZ} = props;

    let plungeFeedGcode = ' F' + plungeFeed;
    let cutFeedGcode = ' F' + cutFeed;

    if (useZ === undefined)
        useZ = false;

    if (tabGeometry === undefined || tabZ <= botZ) {
        tabGeometry = [];
        tabZ = botZ;
    }

    let retractGcode =
        '; Retract\r\n' +
        'G0 Z' + safeZ.toFixed(decimal) + '\r\n';

    let retractForTabGcode =
        '; Retract for tab\r\n' +
        'G0 Z' + tabZ.toFixed(decimal) + '\r\n';

    let gcode = retractGcode;

    function getX(p) {
        return p.X * scale + offsetX;
    }

    function getY(p) {
        return p.Y * scale + offsetY;
    }

    function convertPoint(p, useZ) {
        let result = ' X' + (p.X * scale + offsetX).toFixed(decimal) + ' Y' + (p.Y * scale + offsetY).toFixed(decimal);
        if (useZ)
            result += ' Z' + (p.Z * scale + topZ).toFixed(decimal);
        return result;
    }

    for (let pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
        let path = paths[pathIndex];
        let origPath = path.path;
        if (origPath.length === 0)
            continue;
        let separatedPaths = separateTabs(origPath, tabGeometry);

        gcode +=
            '\r\n' +
            '; Path ' + pathIndex + '\r\n';

        let currentZ = safeZ;
        let finishedZ = topZ;
        while (finishedZ > botZ || useZ) {
            let nextZ = Math.max(finishedZ - passDepth, botZ);
            if (currentZ < safeZ && (!path.safeToClose || tabGeometry.length > 0)) {
                gcode += retractGcode;
                currentZ = safeZ;
            }

            if (tabGeometry.length === 0)
                currentZ = finishedZ;
            else
                currentZ = Math.max(finishedZ, tabZ);
            gcode +=
                '; Rapid to initial position\r\n' +
                'G0' + convertPoint(origPath[0], false) + '\r\n' +
                'G0 Z' + currentZ.toFixed(decimal) + '\r\n';

            let selectedPaths;
            if (nextZ >= tabZ || useZ)
                selectedPaths = [origPath];
            else
                selectedPaths = separatedPaths;

            for (let selectedIndex = 0; selectedIndex < selectedPaths.length; ++selectedIndex) {
                let selectedPath = selectedPaths[selectedIndex];
                if (selectedPath.length === 0)
                    continue;

                if (!useZ) {
                    let selectedZ;
                    if (selectedIndex & 1)
                        selectedZ = tabZ;
                    else
                        selectedZ = nextZ;

                    if (selectedZ < currentZ) {
                        let executedRamp = false;
                        if (ramp) {
                            let minPlungeTime = (currentZ - selectedZ) / plungeFeed;
                            let idealDist = cutFeed * minPlungeTime;
                            let end;
                            let totalDist = 0;
                            for (end = 1; end < selectedPath.length; ++end) {
                                if (totalDist > idealDist)
                                    break;
                                totalDist += 2 * dist(getX(selectedPath[end - 1]), getY(selectedPath[end - 1]), getX(selectedPath[end]), getY(selectedPath[end]));
                            }
                            if (totalDist > 0) {
                                gcode += '; ramp\r\n'
                                executedRamp = true;
                                let rampPath = selectedPath.slice(0, end).concat(selectedPath.slice(0, end - 1).reverse());
                                let distTravelled = 0;
                                for (let i = 1; i < rampPath.length; ++i) {
                                    distTravelled += dist(getX(rampPath[i - 1]), getY(rampPath[i - 1]), getX(rampPath[i]), getY(rampPath[i]));
                                    let newZ = currentZ + distTravelled / totalDist * (selectedZ - currentZ);
                                    gcode += 'G1' + convertPoint(rampPath[i], false) + ' Z' + newZ.toFixed(decimal);
                                    if (i === 1)
                                        gcode += ' F' + Math.min(totalDist / minPlungeTime, cutFeed).toFixed(decimal) + '\r\n';
                                    else
                                        gcode += '\r\n';
                                }
                            }
                        }
                        if (!executedRamp)
                            gcode +=
                                '; plunge\r\n' +
                                'G1 Z' + selectedZ.toFixed(decimal) + plungeFeedGcode + '\r\n';
                    } else if (selectedZ > currentZ) {
                        gcode += retractForTabGcode;
                    }
                    currentZ = selectedZ;
                } // !useZ

                gcode += '; cut\r\n';

                for (let i = 1; i < selectedPath.length; ++i) {
                    gcode += 'G1' + convertPoint(selectedPath[i], useZ);
                    if (i === 1)
                        gcode += cutFeedGcode + '\r\n';
                    else
                        gcode += '\r\n';
                }
            } // selectedIndex
            finishedZ = nextZ;
            if (useZ)
                break;
        } // while (finishedZ > botZ)
        gcode += retractGcode;
    } // pathIndex

    return gcode;
}; // getMillGcode

export function getMillGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert,  done, progress, QE) {
    let ok = true;
    if (op.passDepth <= 0) {
        showAlert("Pass Depth must be greater than 0", "alert-danger");
        ok = false;
    }
    if (op.type === 'Mill V Carve') {
        if (op.toolAngle <= 0 || op.toolAngle >= 180) {
            showAlert("Tool Angle must be in range (0, 180)", "alert-danger");
            ok = false;
        }
    } else {
        if (op.cutDepth <= 0) {
            showAlert("Final Cut Depth must be greater than 0", "alert-danger");
            ok = false;
        }
        if (op.type !== 'Mill Cut' && op.toolDiameter <= 0) {
            showAlert("Tool Diameter must be greater than 0", "alert-danger");
            ok = false;
        }
        if (op.stepOver <= 0 || op.stepOver > 1) {
            showAlert("Step Over must be in range (0,1]", "alert-danger");
            ok = false;
        }
    }
    if (op.plungeRate <= 0) {
        showAlert("Plunge Rate must be greater than 0", "alert-danger");
        ok = false;
    }
    if (op.cutRate <= 0) {
        showAlert("Cut Rate must be greater than 0", "alert-danger");
        ok = false;
    }
    if (!ok)
        done(false);

    QE.push((cb)=>{

        let camPaths = [];
        if (op.type === 'Mill Pocket') {
            if (op.margin)
                geometry = offset(geometry, -op.margin * mmToClipperScale);
            camPaths = pocket(geometry, op.toolDiameter * mmToClipperScale, op.stepOver, op.direction === 'Climb');
        } else if (op.type === 'Mill Cut') {
            camPaths = cut(geometry, openGeometry, op.direction === 'Climb');
        } else if (op.type === 'Mill Cut Inside') {
            if (op.margin)
                geometry = offset(geometry, -op.margin * mmToClipperScale);
            camPaths = insideOutside(geometry, op.toolDiameter * mmToClipperScale, true, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', true);
        } else if (op.type === 'Mill Cut Outside') {
            if (op.margin)
                geometry = offset(geometry, op.margin * mmToClipperScale);
            camPaths = insideOutside(geometry, op.toolDiameter * mmToClipperScale, false, op.cutWidth * mmToClipperScale, op.stepOver, op.direction === 'Climb', true);
        } else if (op.type === 'Mill V Carve') {
            camPaths = vCarve(geometry, op.toolAngle, op.passDepth * mmToClipperScale);
        }

        for (let camPath of camPaths) {
            let path = camPath.path;
            for (let point of path) {
                point.X = Math.round(point.X / mmToClipperScale * 1000) * mmToClipperScale / 1000;
                point.Y = Math.round(point.Y / mmToClipperScale * 1000) * mmToClipperScale / 1000;
            }
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
            "\r\n; Direction:    " + op.direction +
            "\r\n; Cut Depth:    " + op.cutDepth +
            "\r\n; Pass Depth:   " + op.passDepth +
            "\r\n; clearance:    " + op.clearance +
            "\r\n; Plunge rate:  " + op.plungeRate + ' ' + settings.toolFeedUnits +
            "\r\n; Cut rate:     " + op.cutRate + ' ' + settings.toolFeedUnits +
            "\r\n;\r\n";

        gcode += getMillGcode({
            paths: camPaths,
            ramp: false,
            scale: 1 / mmToClipperScale,
            useZ: op.type === 'Mill V Carve',
            offsetX: 0,
            offsetY: 0,
            decimal: 3,
            topZ: 0,
            botZ: -op.cutDepth,
            safeZ: +op.clearance,
            passDepth: op.passDepth,
            plungeFeed: op.plungeRate * feedScale,
            cutFeed: op.cutRate * feedScale,
            tabGeometry: op.type === 'Mill V Carve' ? [] : tabGeometry,
            tabZ: -op.tabDepth,
        });

        done(gcode, cb)
    });
} // getMillGcodeFromOp
