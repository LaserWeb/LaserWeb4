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

import ClipperLib from 'clipper-lib';

import { diff, offset, cppToCamPath, pathsToCpp, clipperToCppScale } from './mesh';


require('script!web-cam-cpp');

export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Does the line from p1 to p2 cross outside of bounds?
function crosses(bounds, p1, p2) {
    if (bounds === null)
        return true;
    if (p1.X === p2.X && p1.Y === p2.Y)
        return false;
    let clipper = new ClipperLib.Clipper();
    clipper.AddPath([p1, p2], ClipperLib.PolyType.ptSubject, false);
    clipper.AddPaths(bounds, ClipperLib.PolyType.ptClip, true);
    let result = new ClipperLib.PolyTree();
    clipper.Execute(ClipperLib.ClipType.ctIntersection, result, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
    if (result.ChildCount() === 1) {
        let child = result.Childs()[0];
        let points = child.Contour();
        if (points.length === 2) {
            if (points[0].X === p1.X && points[1].X === p2.X && points[0].Y === p1.Y && points[1].Y === p2.Y)
                return false;
            if (points[0].X === p2.X && points[1].X === p1.X && points[0].Y === p2.Y && points[1].Y === p1.Y)
                return false;
        }
    }
    return true;
}

// CamPath has this format: {
//      path:               Clipper path
//      safeToClose:        Is it safe to close the path without retracting?
// }

// Try to merge paths. A merged path doesn't cross outside of bounds. Returns array of CamPath.
function mergePaths(bounds, paths) {
    if (paths.length === 0)
        return [];

    let currentPath = paths[0];
    currentPath.push(currentPath[0]);
    let currentPoint = currentPath[currentPath.length - 1];
    paths[0] = [];

    let mergedPaths = [];
    let numLeft = paths.length - 1;
    while (numLeft > 0) {
        let closestPathIndex = null;
        let closestPointIndex = null;
        let closestPointDist = null;
        for (let pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
            let path = paths[pathIndex];
            for (let pointIndex = 0; pointIndex < path.length; ++pointIndex) {
                let point = path[pointIndex];
                let dist = (currentPoint.X - point.X) * (currentPoint.X - point.X) + (currentPoint.Y - point.Y) * (currentPoint.Y - point.Y);
                if (closestPointDist === null || dist < closestPointDist) {
                    closestPathIndex = pathIndex;
                    closestPointIndex = pointIndex;
                    closestPointDist = dist;
                }
            }
        }

        let path = paths[closestPathIndex];
        paths[closestPathIndex] = [];
        numLeft -= 1;
        let needNew = crosses(bounds, currentPoint, path[closestPointIndex]);
        path = path.slice(closestPointIndex, path.length).concat(path.slice(0, closestPointIndex));
        path.push(path[0]);
        if (needNew) {
            mergedPaths.push(currentPath);
            currentPath = path;
            currentPoint = currentPath[currentPath.length - 1];
        }
        else {
            currentPath = currentPath.concat(path);
            currentPoint = currentPath[currentPath.length - 1];
        }
    }
    mergedPaths.push(currentPath);

    let camPaths = [];
    for (let i = 0; i < mergedPaths.length; ++i) {
        let path = mergedPaths[i];
        camPaths.push({
            path: path,
            safeToClose: !crosses(bounds, path[0], path[path.length - 1])
        });
    }

    return camPaths;
}

// Compute paths for pocket operation on Clipper geometry. Returns array
// of CamPath. cutterDia is in Clipper units. stepover is in the range (0, 1].
export function pocket(geometry, cutterDia, stepover, climb) {
    let current = offset(geometry, -cutterDia / 2);
    let bounds = current.slice(0);
    let allPaths = [];
    while (current.length !== 0) {
        if (!climb)
            for (let i = 0; i < current.length; ++i)
                current[i].reverse();
        allPaths = current.concat(allPaths);
        current = offset(current, -cutterDia * stepover);
    }
    return mergePaths(bounds, allPaths);
};

// Compute paths for inside/outside operation on Clipper geometry. Returns array
// of CamPath. cutterDia and width are in Clipper units. stepover is in the 
// range (0, 1].
export function insideOutside(geometry, cutterDia, isInside, width, stepover, climb) {
    width = Math.max(width, cutterDia);

    let currentWidth = cutterDia;
    let allPaths = [];
    let eachWidth = cutterDia * stepover;

    let current;
    let bounds;
    let eachOffset;
    let needReverse;

    if (isInside) {
        current = offset(geometry, -cutterDia / 2);
        bounds = diff(current, offset(geometry, -(width - cutterDia / 2)));
        eachOffset = -eachWidth;
        needReverse = !climb;
    } else {
        current = offset(geometry, cutterDia / 2);
        bounds = diff(offset(geometry, width - cutterDia / 2), current);
        eachOffset = eachWidth;
        needReverse = climb;
    }

    while (currentWidth <= width) {
        if (needReverse)
            for (let i = 0; i < current.length; ++i)
                current[i].reverse();
        allPaths = current.concat(allPaths);
        let nextWidth = currentWidth + eachWidth;
        if (nextWidth > width && width - currentWidth > 0) {
            current = offset(current, width - currentWidth);
            if (needReverse)
                for (let i = 0; i < current.length; ++i)
                    current[i].reverse();
            allPaths = current.concat(allPaths);
            break;
        }
        currentWidth = nextWidth;
        if (currentWidth <= width)
            current = offset(current, eachOffset);
    }
    return mergePaths(bounds, allPaths);
};

// Compute paths for engrave operation on Clipper geometry. Returns array
// of CamPath.
export function engrave(geometry, climb) {
    let allPaths = [];
    for (let i = 0; i < geometry.length; ++i) {
        let path = geometry[i].slice(0);
        if (climb)
            path.reverse();
        path.push(path[0]);
        allPaths.push(path);
    }
    let result = mergePaths(null, allPaths);
    for (let i = 0; i < result.length; ++i)
        result[i].safeToClose = true;
    return result;
};

export function vCarve(geometry, cutterAngle, passDepth) {
    if (cutterAngle <= 0 || cutterAngle >= 180)
        return [];

    let memoryBlocks = [];
    let cGeometry = pathsToCpp(memoryBlocks, geometry);
    let resultPathsRef = Module._malloc(4);
    let resultNumPathsRef = Module._malloc(4);
    let resultPathSizesRef = Module._malloc(4);
    memoryBlocks.push(resultPathsRef);
    memoryBlocks.push(resultNumPathsRef);
    memoryBlocks.push(resultPathSizesRef);

    let debugArg0 = 0, debugArg1 = 0;

    //extern "C" void vCarve(
    //    int debugArg0, int debugArg1,
    //    double** paths, int numPaths, int* pathSizes,
    //    double cutterAngle, double passDepth,
    //    double**& resultPaths, int& resultNumPaths, int*& resultPathSizes)
    Module.ccall(
        'vCarve',
        'void', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [
            debugArg0, debugArg1, cGeometry[0], cGeometry[1], cGeometry[2],
            cutterAngle, passDepth * clipperToCppScale,
            resultPathsRef, resultNumPathsRef, resultPathSizesRef
        ]);

    let result = cppToCamPath(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

    for (let i = 0; i < memoryBlocks.length; ++i)
        Module._free(memoryBlocks[i]);

    return result;
};

// Convert array of CamPath to array of Clipper path
export function getClipperPathsFromCamPaths(paths) {
    let result = [];
    if (paths !== null)
        for (let i = 0; i < paths.length; ++i)
            result.push(paths[i].path);
    return result;
}

let displayedCppTabError1 = false;
let displayedCppTabError2 = false;

export function separateTabs(cutterPath, tabGeometry) {
    if (tabGeometry.length === 0)
        return [cutterPath];
    if (typeof Module === 'undefined') {
        if (!displayedCppTabError1) {
            showAlert("Failed to load cam-cpp.js; tabs will be missing. This message will not repeat.", "alert-danger", false);
            displayedCppTabError1 = true;
        }
        return cutterPath;
    }

    let memoryBlocks = [];

    let cCutterPath = jscut.priv.path.convertPathsToCpp(memoryBlocks, [cutterPath]);
    let cTabGeometry = jscut.priv.path.convertPathsToCpp(memoryBlocks, tabGeometry);

    let errorRef = Module._malloc(4);
    let resultPathsRef = Module._malloc(4);
    let resultNumPathsRef = Module._malloc(4);
    let resultPathSizesRef = Module._malloc(4);
    memoryBlocks.push(errorRef);
    memoryBlocks.push(resultPathsRef);
    memoryBlocks.push(resultNumPathsRef);
    memoryBlocks.push(resultPathSizesRef);

    //extern "C" void separateTabs(
    //    double** pathPolygons, int numPaths, int* pathSizes,
    //    double** tabPolygons, int numTabPolygons, int* tabPolygonSizes,
    //    bool& error,
    //    double**& resultPaths, int& resultNumPaths, int*& resultPathSizes)
    Module.ccall(
        'separateTabs',
        'void', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [cCutterPath[0], cCutterPath[1], cCutterPath[2], cTabGeometry[0], cTabGeometry[1], cTabGeometry[2], errorRef, resultPathsRef, resultNumPathsRef, resultPathSizesRef]);

    if (Module.HEAPU32[errorRef >> 2] && !displayedCppTabError2) {
        showAlert("Internal error processing tabs; tabs will be missing. This message will not repeat.", "alert-danger", false);
        displayedCppTabError2 = true;
    }

    let result = jscut.priv.path.convertPathsFromCpp(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

    for (let i = 0; i < memoryBlocks.length; ++i)
        Module._free(memoryBlocks[i]);

    return result;
}
