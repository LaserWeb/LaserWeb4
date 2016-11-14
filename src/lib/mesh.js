// Copyright 2014-2016 Todd Fleming
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

// TODO: pass React elements to alertFn

"use strict";

import ClipperLib from 'clipper-lib';
import Snap from 'snapsvg-cjs';
import SweepContext from 'poly2tri/src/sweepcontext';

export const inchToClipperScale = 1270000000;
export const mmToClipperScale = inchToClipperScale / 25.4; // 50000000;
export const clipperToCppScale = 1 / 128; // Prevent overflow for coordinates up to ~1000 mm
export const cleanPolyDist = 100;
export const arcTolerance = 10000;

// Linearize a cubic bezier. Returns ['L', x2, y2, x3, y3, ...]. The return value doesn't
// include (p1x, p1y); it's part of the previous segment.
function linearizeCubicBezier(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, minNumSegments, minSegmentLength) {
    function bez(p0, p1, p2, p3, t) {
        return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
    }

    if (p1x == c1x && p1y == c1y && p2x == c2x && p2y == c2y)
        return ['L', p2x, p2y];

    let numSegments = minNumSegments;
    while (true) {
        let x = p1x;
        let y = p1y;
        let result = ['L'];
        for (let i = 1; i <= numSegments; ++i) {
            let t = 1.0 * i / numSegments;
            let nextX = bez(p1x, c1x, c2x, p2x, t);
            let nextY = bez(p1y, c1y, c2y, p2y, t);
            if ((nextX - x) * (nextX - x) + (nextY - y) * (nextY - y) > minSegmentLength * minSegmentLength) {
                numSegments *= 2;
                result = null;
                break;
            }
            result.push(nextX, nextY);
            x = nextX;
            y = nextY;
        }
        if (result)
            return result;
    }
}

// Linearize a path. Both the input path and the returned path are in snap.svg's format.
// Calls alertFn with an error message and returns null if there's a problem.
function linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn) {
    if (path.length < 2 || path[0].length != 3 || path[0][0] != 'M') {
        alertFn('Path does not begin with M')
        return null;
    }
    let x = path[0][1];
    let y = path[0][2];
    let result = [path[0]];
    for (let i = 1; i < path.length; ++i) {
        let subpath = path[i];
        if (subpath[0] == 'C' && subpath.length == 7) {
            result.push(linearizeCubicBezier(
                x, y, subpath[1], subpath[2], subpath[3], subpath[4], subpath[5], subpath[6], minNumSegments, minSegmentLength));
            x = subpath[5];
            y = subpath[6];
        } else if (subpath[0] == 'M' && subpath.length == 3) {
            result.push(subpath);
            x = subpath[1];
            y = subpath[2];
        } else {
            alertFn('Subpath has an unknown prefix: ' + subpath[0]);
            return null;
        }
    }
    return result;
};

// Get a linear path from an element in snap.svg's format. Calls alertFn with an 
// error message and returns null if there's a problem.
function elementToLinearSnapPath(element, minNumSegments, minSegmentLength, alertFn) {
    let path = null;
    let snapElement = Snap(element);

    if (snapElement.type == 'path')
        path = snapElement.attr('d');
    else if (snapElement.type == 'rect') {
        let x = Number(snapElement.attr('x'));
        let y = Number(snapElement.attr('y'));
        let w = Number(snapElement.attr('width'));
        let h = Number(snapElement.attr('height'));
        path = 'm' + x + ',' + y + ' ' + w + ',' + 0 + ' ' + 0 + ',' + h + ' ' + (-w) + ',' + 0 + ' ' + 0 + ',' + (-h) + ' ';
    }
    else {
        alertFn('<b>' + snapElement.type + "</b> is not supported; try Inkscape's <strong>Object to Path</strong> command");
        return null;
    }

    if (snapElement.attr('clip-path') != '') {
        alertFn('clip-path is not supported');
        return null;
    }

    if (snapElement.attr('mask') != '') {
        alertFn('mask is not supported');
        return null;
    }

    if (path == null) {
        alertFn('path is missing');
        return;
    }

    path = Snap.path.map(path, snapElement.transform().globalMatrix);
    path = Snap.parsePathString(path);
    path = linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn);
    return path;
};

// Convert a path in snap.svg format to [[x0, y0, 0, x1, y1, 0, ...], ...].
// Result is in mm. Doesn't close paths. Returns multiple paths. Only supports linear paths.
// Calls alertFn with an error message and returns null if there's a problem.
function snapPathToPositions(path, pxPerInch, alertFn) {
    let factor = 25.4 / pxPerInch;
    if (path.length < 2 || path[0].length != 3 || path[0][0] != 'M') {
        alertFn('Path does not begin with M');
        return null;
    }
    let currentPath = [path[0][1] * factor, path[0][2] * factor, 0];
    let result = [currentPath];
    for (let i = 1; i < path.length; ++i) {
        let subpath = path[i];
        if (subpath[0] == 'M' && subpath.length == 3) {
            currentPath = [subpath[1] * factor, subpath[2] * factor, 0];
            result.push(currentPath);
        } else if (subpath[0] == 'L') {
            for (let j = 0; j < (subpath.length - 1) / 2; ++j)
                currentPath.push(subpath[1 + j * 2] * factor, subpath[2 + j * 2] * factor, 0);
        } else {
            alertFn('Subpath has a non-linear prefix: ' + subpath[0]);
            return null;
        }
    }
    return result;
};

// Closes each path in positions.
function closePositions(positions) {
    for (let path of positions)
        path.push(path[0], path[1], path[2]);
}

// Convert a path in an SVG element to [[x0, y0, 0, x1, y1, 0, ...], ...].
// Result is in mm. Returns multiple paths. Converts curves.
// Calls alertFn with an error message and returns null if there's a problem.
export function elementToPositions(element, pxPerInch, minNumSegments, minSegmentLength, alertFn) {
    let path = elementToLinearSnapPath(element, minNumSegments, minSegmentLength, alertFn);
    if (path !== null) {
        let positions = snapPathToPositions(path, pxPerInch, alertFn);
        if (positions !== null) {
            closePositions(positions);
            return positions;
        }
    }
    return null;
}

// [[[x0, y0, 0, x1, y1, 0, ...], ...], ...]
export function flipY(allPositions) {
    let maxY = Number.MIN_VALUE;
    for (let positions of allPositions)
        for (let a of positions)
            for (let i = 0; i < a.length; i += 3)
                maxY = Math.max(maxY, a[i + 1]);
    for (let positions of allPositions)
        for (let a of positions)
            for (let i = 0; i < a.length; i += 3)
                a[i + 1] = maxY - a[i + 1];
}

export function positionsToClipperPaths(positions, translateX, translateY) {
    return positions.map(p => {
        let path = [];
        for (let i = 0; i < p.length; i += 3)
            path.push({ X: (p[i] + translateX) * mmToClipperScale, Y: (p[i + 1] + translateY) * mmToClipperScale });
        return path;
    });
}

function clipperPathsToPolyTree(paths) {
    let c = new ClipperLib.Clipper();
    c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
    let polyTree = new ClipperLib.PolyTree();
    c.Execute(ClipperLib.ClipType.ctUnion, polyTree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
    return polyTree;
}

function triangulatePolyTree(polyTree, z) {
    let result = [];
    let pointToVertex = point => ({ x: point.X / mmToClipperScale, y: point.Y / mmToClipperScale });
    let contourToVertexes = path => path.map(pointToVertex);
    let nodesToVertexes = nodes => nodes.map(node => contourToVertexes(node.Contour()));
    let processNode = node => {
        let vertexes = contourToVertexes(node.Contour());
        let holes = nodesToVertexes(node.Childs());
        let context = new SweepContext(vertexes);
        context.addHoles(holes);
        context.triangulate();
        let triangles = context.getTriangles();
        for (let t of triangles) {
            let p = t.getPoints();
            result.push(
                p[0].x, p[0].y, z,
                p[1].x, p[1].y, z,
                p[2].x, p[2].y, z);
        }
        for (let hole of node.Childs()) {
            for (let next of hole.Childs()) {
                processNode(next);
            }
        }
    };
    for (let node of polyTree.Childs()) {
        processNode(node);
    }
    return result;
}

export function triangulatePositions(positions, z) {
    return triangulatePolyTree(clipperPathsToPolyTree(positionsToClipperPaths(positions, 0, 0)), z);
}

// Convert Clipper paths to C format. Returns [double** cPaths, int cNumPaths, int* cPathSizes].
export function pathsToCpp(memoryBlocks, paths) {
    let doubleSize = 8;

    let cPaths = Module._malloc(paths.length * 4);
    memoryBlocks.push(cPaths);
    let cPathsBase = cPaths >> 2;

    let cPathSizes = Module._malloc(paths.length * 4);
    memoryBlocks.push(cPathSizes);
    let cPathSizesBase = cPathSizes >> 2;

    for (let i = 0; i < paths.length; ++i) {
        let path = paths[i];

        let cPath = Module._malloc(path.length * 2 * doubleSize + 4);
        memoryBlocks.push(cPath);
        if (cPath & 4)
            cPath += 4;
        //console.log("-> " + cPath.toString(16));
        let pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);

        for (let j = 0; j < path.length; ++j) {
            let point = path[j];
            pathArray[j * 2] = point.X * clipperToCppScale;
            pathArray[j * 2 + 1] = point.Y * clipperToCppScale;
        }

        Module.HEAPU32[cPathsBase + i] = cPath;
        Module.HEAPU32[cPathSizesBase + i] = path.length;
    }

    return [cPaths, paths.length, cPathSizes];
}

// Convert C format paths to array of CamPath. double**& cPathsRef, int& cNumPathsRef, int*& cPathSizesRef
// Each point has X, Y, Z (stride = 3).
export function cppToCamPath(memoryBlocks, cPathsRef, cNumPathsRef, cPathSizesRef) {
    let cPaths = Module.HEAPU32[cPathsRef >> 2];
    memoryBlocks.push(cPaths);
    let cPathsBase = cPaths >> 2;

    let cNumPaths = Module.HEAPU32[cNumPathsRef >> 2];

    let cPathSizes = Module.HEAPU32[cPathSizesRef >> 2];
    memoryBlocks.push(cPathSizes);
    let cPathSizesBase = cPathSizes >> 2;

    let convertedPaths = [];
    for (let i = 0; i < cNumPaths; ++i) {
        let pathSize = Module.HEAPU32[cPathSizesBase + i];
        let cPath = Module.HEAPU32[cPathsBase + i];
        // cPath contains value to pass to Module._free(). The aligned version contains the actual data.
        memoryBlocks.push(cPath);
        if (cPath & 4)
            cPath += 4;
        let pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);

        let convertedPath = [];
        convertedPaths.push({ path: convertedPath, safeToClose: false });
        for (let j = 0; j < pathSize; ++j)
            convertedPath.push({
                X: pathArray[j * 3] / clipperToCppScale,
                Y: pathArray[j * 3 + 1] / clipperToCppScale,
                Z: pathArray[j * 3 + 2] / clipperToCppScale,
            });

        //console.log('got: path', i, ':', pathArray[0], pathArray[1], pathArray[2]);
    }

    return convertedPaths;
}

// Clip Clipper geometry. clipType is a ClipperLib.ClipType constant. Returns new geometry.
export function clip(paths1, paths2, clipType) {
    var clipper = new ClipperLib.Clipper();
    clipper.AddPaths(paths1, ClipperLib.PolyType.ptSubject, true);
    clipper.AddPaths(paths2, ClipperLib.PolyType.ptClip, true);
    var result = [];
    clipper.Execute(clipType, result, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
    return result;
}

// Return union of two Clipper geometries. Returns new geometry.
export function union(paths1, paths2) {
    return clip(paths1, paths2, ClipperLib.ClipType.ctUnion);
}

// Return difference between two Clipper geometries. Returns new geometry.
export function diff(paths1, paths2) {
    return clip(paths1, paths2, ClipperLib.ClipType.ctDifference);
}

// Offset Clipper geometries by amount (positive expands, negative shrinks). Returns new geometry.
export function offset(paths, amount, joinType, endType) {
    if (joinType === undefined)
        joinType = ClipperLib.JoinType.jtRound;
    if (endType === undefined)
        endType = ClipperLib.EndType.etClosedPolygon;

    // bug workaround: join types are swapped in ClipperLib 6.1.3.2
    if (joinType === ClipperLib.JoinType.jtSquare)
        joinType = ClipperLib.JoinType.jtMiter;
    else if (joinType === ClipperLib.JoinType.jtMiter)
        joinType = ClipperLib.JoinType.jtSquare;

    var co = new ClipperLib.ClipperOffset(2, arcTolerance);
    co.AddPaths(paths, joinType, endType);
    var offsetted = [];
    co.Execute(offsetted, amount);
    return offsetted;
}
