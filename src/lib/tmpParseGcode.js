// Copyright 2014, 2016, 2017 Todd Fleming
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

export function parseGcode(gcode) {
    let path = [];
    let lastG = NaN, lastX = NaN, lastY = NaN, lastZ = NaN, lastA = NaN, lastF = NaN, lastS = 0, lastT = 0;
    let stride = 9;
    let i = 0;
    while (i < gcode.length) {
        function parse() {
            ++i;
            while (i < gcode.length && (gcode[i] == ' ' || gcode[i] == '\t'))
                ++i;
            let begin = i;
            while (i < gcode.length && "+-.0123456789".indexOf(gcode[i]) != -1)
                ++i;
            return Number(gcode.substr(begin, i - begin));
        }
        let g = NaN, x = NaN, y = NaN, z = NaN, a = NaN, f = NaN;
        while (i < gcode.length && gcode[i] != ';' && gcode[i] != '\r' && gcode[i] != '\n') {
            if (gcode[i] == 'G' || gcode[i] == 'g')
                g = parse();
            else if (gcode[i] == 'X' || gcode[i] == 'x')
                x = parse();
            else if (gcode[i] == 'Y' || gcode[i] == 'y')
                y = parse();
            else if (gcode[i] == 'Z' || gcode[i] == 'z')
                z = parse();
            else if (gcode[i] == 'A' || gcode[i] == 'a')
                a = parse();
            else if (gcode[i] == 'F' || gcode[i] == 'f')
                f = parse();
            else if (gcode[i] == 'S' || gcode[i] == 's')
                lastS = parse();
            else if (gcode[i] == 'T' || gcode[i] == 't')
                lastT = parse();
            else
                ++i;
        }
        if (g === 0 || g === 1 || !isNaN(x) || !isNaN(y) || !isNaN(z) || !isNaN(a)) {
            if (g === 0 || g === 1)
                lastG = g;
            if (!isNaN(x)) {
                if (isNaN(lastX))
                    for (let j = 1; j < path.length; j += stride)
                        path[j] = x;
                lastX = x;
            }
            if (!isNaN(y)) {
                if (isNaN(lastY))
                    for (let j = 2; j < path.length; j += stride)
                        path[j] = y;
                lastY = y;
            }
            if (!isNaN(z)) {
                if (isNaN(lastZ))
                    for (let j = 3; j < path.length; j += stride)
                        path[j] = z;
                lastZ = z;
            }
            if (!isNaN(a)) {
                if (isNaN(lastA))
                    for (let j = 6; j < path.length; j += stride)
                        path[j] = a;
                lastA = a;
            }
            if (!isNaN(f)) {
                if (isNaN(lastF))
                    for (let j = 4; j < path.length; j += stride)
                        path[j] = f;
                lastF = f;
            }
            if (!isNaN(lastG)) {
                path.push(lastG);
                path.push(lastX);
                path.push(lastY);
                path.push(lastZ);
                path.push(0); // E
                path.push(lastF);
                path.push(lastA);
                path.push(lastS);
                path.push(lastT);
            }
        }
        while (i < gcode.length && gcode[i] != '\r' && gcode[i] != '\n')
            ++i;
        while (i < gcode.length && (gcode[i] == '\r' || gcode[i] == '\n'))
            ++i;
    }

    if (isNaN(lastX))
        for (let j = 1; j < path.length; j += stride)
            path[j] = 0;
    if (isNaN(lastY))
        for (let j = 2; j < path.length; j += stride)
            path[j] = 0;
    if (isNaN(lastZ))
        for (let j = 3; j < path.length; j += stride)
            path[j] = 0;
    if (isNaN(lastF))
        for (let j = 4; j < path.length; j += stride)
            path[j] = 1000;
    if (isNaN(lastA))
        for (let j = 6; j < path.length; j += stride)
            path[j] = 0;

    return path;
}
