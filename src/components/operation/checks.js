import { SETTINGS_INITIALSTATE } from "../../reducers/settings";
import { operationLatheTurnAdd } from "../../actions/operation";
import { isObject } from "../../lib/helpers";

export const checkPositive = {
    check: v => v > 0,
    error: 'Must be > 0',
};

export const checkPositiveInt = {
    check: v => v > 0 && (v | 0) === +v,
    error: 'Must be integer > 0',
};

export const checkGE0 = {
    check: v => v >= 0,
    error: 'Must be >= 0',
};

export const checkGE0Int = {
    check: v => v >= 0 && (v | 0) === +v,
    error: 'Must be integer >= 0',
};

export const checkNot0 = {
    check: v => +v != 0,
    error: 'Must be non-0',
};

export const checkPercent = {
    check: v => v >= 0 && v <= 100,
    error: 'Must be in range [0, 100]',
};

export const checkStepOver = {
    check: v => v > 0 && v <= 100,
    error: 'Must be > 0 and <= 100',
};

export const checkToolAngle = {
    check: v => v > 0 && v < 180,
    error: 'Must be in range (0, 180)',
};

export const checkToolDiameter = {
    check: (v, settings, op) => v > 0 || op.type === 'Mill Cut' && v >= 0,
    error: (v, settings, op) => op.type === 'Mill Cut' ? 'Must be >= 0' : 'Must be > 0',
};

export function checkRange(min, max) {
    return {
        check: (v) => {
            if (isFinite(v)) {
                return v >= min && v <= max;
            } else if (isObject(v) && v.hasOwnProperty('min') && v.hasOwnProperty('max')) {
                return (v.min >= min && v.min <= max) && (v.max >= min && v.max <= max)
            }
        },
        error: 'Must be in range [' + min + ' , ' + max + ']',
    }
}

export function checkFeedRateRange(axis) {
    return {
        check: (v, settings) => {

            let { min, max } = Object.assign(SETTINGS_INITIALSTATE.machineFeedRange, settings.machineFeedRange)[axis];
            if (isFinite(v)) {
                return v >= min && v <= max;
            } else if (isObject(v) && v.hasOwnProperty('min') && v.hasOwnProperty('max')) {
                return (v.min >= min && v.min <= max) && (v.max >= min && v.max <= max)
            }
        },
        error: (v, settings) => {
            let { min, max } = Object.assign(SETTINGS_INITIALSTATE.machineFeedRange, settings.machineFeedRange)[axis];

            if (isNaN(min) || isNaN(max)) {
                return 'Check settings/machine first!';
			}

            return 'Must be in range [' + min + ' , ' + max + ']'
        }
    }
}

export const ifUseA = {
    condition: op => op.useA
};

export const checkZHeight = {
    check: (v, settings) => settings.machineZEnabled && !isNaN(v),
    error: (v, settings, op) => {
        if (!op.type.match(/^Laser/)) {
			return false;
		}

        if (!settings.machineZEnabled) {
			return 'Laser Z Stage must be enabled';
		}

        return 'Has to be a number';
    }
}

export const ifUseZ = {
    condition: (op, settings) => {
        if (!op.type.match(/^Laser/)) {
			return true;
		}

        return settings.machineZEnabled
    }
};

export const ifUseBlower = {
    condition: (op, settings) => {
        if (!op.type.match(/^Laser/)) {
			return false;
		}

        return settings.machineBlowerEnabled
    }
};

export const ifUseFluid = {
    condition: (op, settings) => {
        if (!op.type.match(/^Mill/) && !op.type.match(/^Lathe/)) {
			return false;
		}

        return settings.machineFluidEnabled
    }
};

export const checkPassDepth = {
    check: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.check(v, settings, op) : checkPositive.check(v, settings, op) },
    error: (v, settings, op) => { return (op.type.match(/^Laser/)) ? checkGE0.error : checkPositive.error },
}

export const checkMillStartZ = {
    check: (v, settings, op) => v <= op.millRapidZ,
    error: 'Must be <= Rapid Z',
};

export const checkMillEndZ = {
    check: (v, settings, op) => v < op.millStartZ,
    error: 'Must be < Start Z',
};

export const checkLatheStartZ = {
    check: (v, settings, op) => v <= op.latheRapidToZ - op.latheFinishDepth,
    error: 'Must be <= Rapid To Z - Finish Depth',
};

export const checkLatheFaceEndDiameter = {
    condition: op => op.latheFace,
    check: (v, settings, op) => {
        if (op.latheFaceEndDiameter >= op.latheRapidToDiameter) {
            return false;
		}

        if (op.latheFaceEndDiameter < -op.latheRapidToDiameter) {
            return false;
		}

        return true;
    },
    error: (v, settings, op) => {
        if (op.latheFaceEndDiameter >= op.latheRapidToDiameter) {
            return "Must be < Rapid To Diameter";
		}

        if (op.latheFaceEndDiameter < -op.latheRapidToDiameter) {
            return "Must be >= -(Rapid To Diameter)";
		}

        return "I'm confused";
    },
};

export const latheTurnAdd = {
    check: (v, settings, op) => op.latheFace || op.latheTurns.length > 0,
    error: 'Need at least one turn when not facing',
    onClick: (e, { op, dispatch }) => dispatch(operationLatheTurnAdd(op.id)),
};

export const checkLatheTurn = {
    check: (v, settings, turn, parent, index) => {
        if (turn.startDiameter < 0) {
            return false;
		}

        if (index > 0 && turn.startDiameter < parent.latheTurns[index - 1].endDiameter) {
            return false;
		}

        if (turn.startDiameter >= parent.latheRapidToDiameter) {
            return false;
		}

        if (turn.endDiameter <= 0) {
            return false;
		}

        if (turn.endDiameter < turn.startDiameter) {
            return false;
		}

        if (turn.endDiameter >= parent.latheRapidToDiameter - parent.latheFinishDepth) {
            return false;
		}

        if (turn.endDiameter !== turn.startDiameter) {
            return false;
		}

        if (turn.length <= 0) {
            return false;
		}

        return true;
    },
    error: (v, settings, turn, parent, index) => {
        if (turn.startDiameter < 0) {
            return 'Start Diameter must be >= 0';
		}

        if (index > 0 && turn.startDiameter < parent.latheTurns[index - 1].endDiameter) {
            return 'Start Diameter must be >= previous End Diameter';
		}

        if (turn.startDiameter >= parent.latheRapidToDiameter) {
            return 'Start Diameter must be < Rapid';
		}

        if (turn.endDiameter <= 0) {
            return 'End Diameter must be > 0';
		}

        if (turn.endDiameter < turn.startDiameter) {
            return 'End Diameter must be >= Start Diameter';
		}

        if (turn.endDiameter >= parent.latheRapidToDiameter - parent.latheFinishDepth) {
            return 'End Diameter must be < Rapid - Finish Depth';
		}

        if (turn.endDiameter !== turn.startDiameter) {
            return 'Taper not implemented yet';
		}

        if (turn.length <= 0) {
            return 'Length must be > 0';
		}

        return "I'm confused";
    },
};
