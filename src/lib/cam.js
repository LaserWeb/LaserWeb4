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
import { mat3, vec2 } from 'gl-matrix';

import { diff, offset, cPathsToClipperPaths, cPathsToCamPaths, clipperBounds, clipperPathsToCPaths, clipperToCppScale } from './mesh';

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

function pathIsClosed(clipperPath) {
    return (
        clipperPath.length >= 2 &&
        clipperPath[0].X === clipperPath[clipperPath.length - 1].X &&
        clipperPath[0].Y === clipperPath[clipperPath.length - 1].Y);
}

// Close all paths
function closeClipperPaths(paths) {
    for (let path of paths)
        path.push(path[0]);
}

// CamPath has this format: {
//      path:               Clipper path
//      safeToClose:        Is it safe to close the path without retracting?
// }

// Try to merge paths. A merged path doesn't cross outside of bounds. Returns array of CamPath.
// If paths contains both open and closed paths, then the closed paths must be before the open
// paths within the array.
function mergePaths(bounds, paths) {
    if (paths.length === 0)
        return [];

    let currentPath = paths[0];
    if (pathIsClosed(currentPath))
        currentPath.push(currentPath[0]);
    let currentPoint = currentPath[currentPath.length - 1];
    paths[0] = [];

    let mergedPaths = [];
    let numLeft = paths.length - 1;
    while (numLeft > 0) {
        let closestPathIndex = null;
        let closestPointIndex = null;
        let closestPointDist = null;
        let closestReverse = false;
        for (let pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
            let path = paths[pathIndex];
            function check(pointIndex) {
                let point = path[pointIndex];
                let dist = (currentPoint.X - point.X) * (currentPoint.X - point.X) + (currentPoint.Y - point.Y) * (currentPoint.Y - point.Y);
                if (closestPointDist === null || dist < closestPointDist) {
                    closestPathIndex = pathIndex;
                    closestPointIndex = pointIndex;
                    closestPointDist = dist;
                    closestReverse = false;
                    return true;
                }
                else
                    return false;
            }
            if (pathIsClosed(path)) {
                for (let pointIndex = 0; pointIndex < path.length; ++pointIndex)
                    check(pointIndex);
            } else if (path.length) {
                check(0);
                if (check(path.length - 1))
                    closestReverse = true;
            }
        }

        let path = paths[closestPathIndex];
        paths[closestPathIndex] = [];
        numLeft -= 1;
        let needNew;
        if (pathIsClosed(path)) {
            needNew = crosses(bounds, currentPoint, path[closestPointIndex]);
            path = path.slice(closestPointIndex, path.length).concat(path.slice(1, closestPointIndex));
            path.push(path[0]);
        } else {
            needNew = true;
            if (closestReverse) {
                path = path.slice();
                path.reverse();
            }
        }
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
    closeClipperPaths(allPaths);
    return mergePaths(bounds, allPaths);
};

// Compute paths for inside/outside operation on Clipper geometry. Returns array
// of CamPath. cutterDia and width are in Clipper units. stepover is in the 
// range (0, 1].
export function insideOutside(geometry, cutterDia, isInside, width, stepover, climb, allowRecutInBounds) {
    width = Math.max(width, cutterDia);

    let currentWidth = cutterDia;
    let allPaths = [];
    let eachWidth = cutterDia * stepover;

    let current;
    let bounds = null;
    let eachOffset;
    let needReverse;

    if (isInside) {
        current = offset(geometry, -cutterDia / 2);
        if (allowRecutInBounds)
            bounds = diff(current, offset(geometry, -(width - cutterDia / 2)));
        eachOffset = -eachWidth;
        needReverse = !climb;
    } else {
        current = offset(geometry, cutterDia / 2);
        if (allowRecutInBounds)
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
    closeClipperPaths(allPaths);
    return mergePaths(bounds, allPaths);
};

// Compute paths for cut operation on Clipper geometry. Returns array
// of CamPath.
export function cut(geometry, openGeometry, climb) {
    let allPaths = [];
    for (let i = 0; i < geometry.length; ++i) {
        let path = geometry[i].slice(0);
        if (climb)
            path.reverse();
        path.push(path[0]);
        allPaths.push(path);
    }
    for (let path of openGeometry)
        allPaths.push(path.slice());
    let result = mergePaths(null, allPaths);
    for (let i = 0; i < result.length; ++i)
        result[i].safeToClose = pathIsClosed(result[i].path);
    return result;
};

export function fillPath(geometry, lineDistance, angle) {
    if (!geometry.length || !geometry[0].length)
        return [];
    let bounds = clipperBounds(geometry);
    let cx = (bounds.minX + bounds.maxX) / 2;
    let cy = (bounds.minY + bounds.maxY) / 2;
    let r = dist(cx, cy, bounds.minX, bounds.minY) + lineDistance;

    let m = mat3.fromTranslation([], [cx, cy]);
    m = mat3.rotate([], m, angle * Math.PI / 180);
    m = mat3.translate([], m, [-cx, -cy]);
    let makePoint = (x, y) => {
        let p = vec2.transformMat3([], [x, y], m);
        return { X: p[0], Y: p[1] };
    }

    let scan = [];
    for (let y = cy - r; y < cy + r; y += lineDistance * 2) {
        scan.push(
            makePoint(cx - r, y),
            makePoint(cx + r, y),
            makePoint(cx + r, y + lineDistance),
            makePoint(cx - r, y + lineDistance),
        );
    }

    let allPaths = [];
    let separated = separateTabs(scan, geometry);
    for (let i = 1; i < separated.length; i += 2)
        allPaths.push(separated[i]);
    return mergePaths(null, allPaths);
};

export function vCarve(geometry, cutterAngle, passDepth) {
    if (cutterAngle <= 0 || cutterAngle >= 180)
        return [];

    let memoryBlocks = [];
    let cGeometry = clipperPathsToCPaths(memoryBlocks, geometry);
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

    let result = cPathsToCamPaths(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

    for (let i = 0; i < memoryBlocks.length; ++i)
        Module._free(memoryBlocks[i]);

    return result;
};

export function reduceCamPaths(camPaths, minDist) {
    let minDistSqr = minDist * minDist;
    let distSqr = (p1, p2) => (p1.X - p2.X) * (p1.X - p2.X) + (p1.Y - p2.Y) * (p1.Y - p2.Y);
    for (let camPath of camPaths) {
        let path = camPath.path;
        let newPath = [path[0]];
        for (let i = 1; i < path.length - 1; ++i) {
            let sq = distSqr(path[i], newPath[newPath.length - 1]);
            if (sq > 0 && sq >= minDistSqr)
                newPath.push(path[i]);
        }
        newPath.push(path[path.length - 1]);
        camPath.path = newPath;
    }
}

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
            showAlert("Failed to load cam-cpp.js; tabs will be missing. This message will not repeat.", "danger", false);
            displayedCppTabError1 = true;
        }
        return cutterPath;
    }

    let memoryBlocks = [];

    let cCutterPath = clipperPathsToCPaths(memoryBlocks, [cutterPath]);
    let cTabGeometry = clipperPathsToCPaths(memoryBlocks, tabGeometry);

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
        showAlert("Internal error processing tabs; tabs will be missing. This message will not repeat.", "danger", false);
        displayedCppTabError2 = true;
    }

    let result = cPathsToClipperPaths(memoryBlocks, resultPathsRef, resultNumPathsRef, resultPathSizesRef);

    for (let i = 0; i < memoryBlocks.length; ++i)
        Module._free(memoryBlocks[i]);

    return result;
}
