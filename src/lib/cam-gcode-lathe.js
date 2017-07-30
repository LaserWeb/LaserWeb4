// Copyright 2017 Todd Fleming
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

class GcodeGenerator {
    constructor({ decimal, toolFeedUnits }) {
        Object.assign(this, { decimal, toolFeedUnits });
        if (toolFeedUnits === 'mm/s')
            this.feedScale = 60;
        else
            this.feedScale = 1;
        this.gcode = '';
    }

    getMotion(mode) {
        if (this.motionMode === mode)
            return '';
        this.motionMode = mode;
        return mode + ' ';
    }

    getFeed(f) {
        let strF = (f * this.feedScale).toFixed(this.decimal);
        let roundedF = Number(strF);
        if (this.f === roundedF)
            return '';
        this.f = roundedF;
        return 'F' + strF + ' ';
    }

    rapidZ(z) {
        let strZ = z.toFixed(this.decimal);
        let roundedZ = Number(strZ);
        if (this.z === roundedZ)
            return;
        this.z = roundedZ;
        this.gcode += this.getMotion('G0') + 'Z' + strZ + '\n';
    }

    rapidXDia(xDia, backSide) {
        if (!backSide)
            xDia = -xDia;
        let strX = (xDia / 2).toFixed(this.decimal);
        let roundedX = Number(strX);
        if (this.x === roundedX)
            return;
        this.x = roundedX;
        this.gcode += this.getMotion('G0') + 'X' + strX + '\n';
    }

    moveZ(z, f) {
        let strZ = z.toFixed(this.decimal);
        let roundedZ = Number(strZ);
        if (this.z === roundedZ)
            return;
        this.z = roundedZ;
        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'Z' + strZ + '\n';

    }

    moveXDia(xDia, backSide, f) {
        if (!backSide)
            xDia = -xDia;
        let strX = (xDia / 2).toFixed(this.decimal);
        let roundedX = Number(strX);
        if (this.x === roundedX)
            return;
        this.x = roundedX;
        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'X' + strX + '\n';
    }
}; // GcodeGenerator

function latheConvFaceTurn(gen, showAlert, props) {
    let {
        latheToolBackSide, latheRapidToDiameter, latheRapidToZ, latheStartZ, latheRoughingFeed,
        latheRoughingDepth, latheFinishFeed, latheFinishDepth, latheFinishExtraPasses, latheFace,
        latheFaceEndDiameter, latheTurns } = props;

    if (latheRapidToDiameter <= 0) return showAlert('latheRapidToDiameter <= 0', 'danger');
    if (latheStartZ > latheRapidToZ) return showAlert('latheStartZ > latheRapidToZ', 'danger');
    if (latheRoughingFeed <= 0) return showAlert('latheRoughingFeed <= 0', 'danger');
    if (latheRoughingDepth <= 0) return showAlert('latheRoughingDepth <= 0', 'danger');
    if (latheFinishFeed <= 0) return showAlert('latheFinishFeed <= 0', 'danger');
    if (latheFinishDepth < 0) return showAlert('latheFinishDepth < 0', 'danger');
    if (latheStartZ + latheFinishDepth > latheRapidToZ) return showAlert('latheStartZ + latheFinishDepth > latheRapidToZ', 'danger');
    if (latheFinishExtraPasses < 0) return showAlert('latheFinishExtraPasses < 0', 'danger');
    if (latheFace && latheFaceEndDiameter >= latheRapidToDiameter) return showAlert('latheFace && latheFaceEndDiameter >= latheRapidToDiameter', 'danger');
    if (!latheFace && !latheTurns.length) return showAlert('!latheFace && !latheTurns.length', 'danger');

    for (let i = 0; i < latheTurns.length; ++i) {
        if (latheTurns[i].startDiameter < 0) return showAlert('i=' + i + ': latheTurns[i].startDiameter < 0');
        if (i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter) return showAlert('i=' + i + ': i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter');
        if (latheTurns[i].startDiameter >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].startDiameter >= latheRapidToDiameter');
        if (latheTurns[i].endDiameter <= 0) return showAlert('i=' + i + ': latheTurns[i].endDiameter <= 0');
        if (latheTurns[i].endDiameter < latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter < latheTurns[i].startDiameter');
        if (latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter');
        if (latheTurns[i].endDiameter != latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter != latheTurns[i].startDiameter');
        if (latheTurns[i].length <= 0) return showAlert('i=' + i + ': latheTurns[i].length <= 0');
    }

    gen.gcode +=
        '\r\n; latheToolBackSide:       ' + latheToolBackSide +
        '\r\n; latheRapidToDiameter:    ' + latheRapidToDiameter + ' mm' +
        '\r\n; latheRapidToZ:           ' + latheRapidToZ + ' mm' +
        '\r\n; latheStartZ:             ' + latheStartZ + ' mm' +
        '\r\n; latheRoughingFeed:       ' + latheRoughingFeed + gen.toolFeedUnits +
        '\r\n; latheRoughingDepth:      ' + latheRoughingDepth + ' mm' +
        '\r\n; latheFinishFeed:         ' + latheFinishFeed + gen.toolFeedUnits +
        '\r\n; latheFinishDepth:        ' + latheFinishDepth + ' mm' +
        '\r\n; latheFinishExtraPasses:  ' + latheFinishExtraPasses +
        '\r\n; latheFace:               ' + latheFace +
        '\r\n; latheFaceEndDiameter:    ' + latheFaceEndDiameter + ' mm' +
        '';

    if (latheTurns.length) {
        gen.gcode += '\r\n; turns:';
        for (let turn of latheTurns)
            gen.gcode +=
                '\r\n;     startDiameter:       ' + turn.startDiameter + ' mm' +
                '\r\n;     endDiameter:         ' + turn.endDiameter + ' mm' +
                '\r\n;     length:              ' + turn.length + ' mm' +
                '';
    }

    gen.gcode += '\n\n; Rapid\n';
    gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
    gen.rapidZ(latheRapidToZ);

    if (latheFace) {
        gen.gcode += '\n; Face roughing\n';
        let z = latheRapidToZ;
        while (true) {
            let nextZ = Math.max(z - latheRoughingDepth, latheStartZ + latheFinishDepth);
            if (nextZ === z)
                break;
            z = nextZ;
            gen.moveZ(z, latheRoughingFeed);
            gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheRoughingFeed);
            gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheRoughingFeed);
            gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
        }
        gen.gcode += '\n; Face finishing\n';
        let n = latheFinishExtraPasses;
        if (z > latheStartZ) {
            ++n;
            z = latheStartZ;
        }
        for (let i = 0; i < n; ++i) {
            gen.moveZ(z, latheFinishFeed);
            gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheFinishFeed);
            gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheFinishFeed);
            gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
        }
        latheRapidToZ = Math.min(z + latheRoughingDepth, latheRapidToZ);
        gen.rapidZ(latheRapidToZ);
    }

    if (latheTurns.length) {
        gen.gcode += '\n; Turn roughing\n';
        let turnRapidToDiameter = latheRapidToDiameter;
        let startX = turnRapidToDiameter - latheRoughingDepth;
        while (true) {
            let x = startX;
            let z = latheRapidToZ;
            let turnStartZ = latheStartZ + latheFinishDepth;
            let done = false;
            for (let turn of latheTurns) {
                if (x < turn.startDiameter + latheFinishDepth && turn.startDiameter + latheFinishDepth < startX + latheRoughingDepth)
                    x = turn.startDiameter + latheFinishDepth;
                if (x < turn.startDiameter + latheFinishDepth) {
                    if (turn === latheTurns[0]) {
                        done = true;
                        break;
                    }
                    gen.moveXDia(x, latheToolBackSide, latheRoughingFeed);
                    z = turnStartZ;
                    gen.moveZ(z, latheRoughingFeed);
                    gen.moveXDia(Math.min(x + latheRoughingDepth, turnRapidToDiameter), latheToolBackSide, latheRoughingFeed);
                    break;
                } else {
                    gen.moveXDia(x, latheToolBackSide, latheRoughingFeed);
                    z = turnStartZ - turn.length;
                    gen.moveZ(z, latheRoughingFeed);
                }
                turnStartZ -= turn.length;
            }
            if (done)
                break;
            turnRapidToDiameter = Math.min(turnRapidToDiameter, x + latheRoughingDepth);
            startX -= latheRoughingDepth;
            gen.moveXDia(turnRapidToDiameter, latheToolBackSide, latheRoughingFeed);
            gen.rapidZ(latheRapidToZ);
        }

        gen.gcode += '\n; Turn finishing\n';
        gen.rapidXDia(latheTurns[0].startDiameter, latheToolBackSide);
        let z = latheStartZ;
        for (let turn of latheTurns) {
            gen.moveXDia(turn.startDiameter, latheToolBackSide, latheFinishFeed);
            z -= turn.length;
            gen.moveZ(z, latheFinishFeed);
        }
        gen.moveXDia(latheRapidToDiameter, latheToolBackSide, latheFinishFeed);
        gen.rapidZ(latheRapidToZ);
    } // if(latheTurns.length)

    gen.gcode += '\n';
} // latheConvFaceTurn

export function getLatheGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
    let gen = new GcodeGenerator({ ...settings, decimal: 2 });
    gen.gcode =
        '\r\n;' +
        '\r\n; Operation:               ' + opIndex +
        '\r\n; Type:                    ' + op.type +
        '';
    if (op.hookOperationStart.length)
        gen.gcode += op.hookOperationStart;
    if (op.type === 'Lathe Conv Face/Turn')
        latheConvFaceTurn(gen, showAlert, op);
    if (op.hookOperationEnd.length)
        gen.gcode += op.hookOperationEnd;
    done(gen.gcode)
} // getLatheGcodeFromOp
