import React from 'react'
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { v4 as uuidv4 } from 'uuid';

import { operationLatheTurnRemove, spreadOperationField } from "../../actions/operation";
import { ButtonInput, DirectionInput, FilterInput, GrayscaleInput, NumberInput, StringInput, TableInput, TagInput, ToggleInput } from "./inputs";

import {
	checkFeedRateRange, checkGE0, checkGE0Int, checkLatheFaceEndDiameter, checkLatheStartZ, checkLatheTurn,
	checkMillEndZ, checkMillStartZ, checkPassDepth, checkPercent, checkPositive, checkPositiveInt, checkRange,
	checkStepOver, checkToolAngle, checkToolDiameter, checkZHeight, ifUseA, ifUseBlower, ifUseFluid, ifUseZ, latheTurnAdd
} from "./checks";

const FieldContextMenu = (id = uuidv4()) => {
	return ({ children, dispatch, op, field }) => {
		let ctx = <ContextMenu id={id}>
			<MenuItem onClick={() => dispatch(spreadOperationField(op.id, field.name))}>Copy to all Ops</MenuItem>
		</ContextMenu>
		return <div title="Right click or long press for options"><ContextMenuTrigger id={id} holdToDisplay={1000}>{children}</ContextMenuTrigger>{ctx}</div>
	}
}

export const OPERATION_LATHE_TURN_FIELDS = {
	startDiameter: { name: 'startDiameter', label: 'Start Diameter', input: NumberInput, style: { width: 80 }, ...checkLatheTurn, contextMenu: FieldContextMenu() },
	endDiameter: { name: 'endDiameter', label: 'End Diameter', input: NumberInput, style: { width: 80 }, contextMenu: FieldContextMenu() },
	length: { name: 'length', label: 'Length', input: NumberInput, style: { width: 80 }, contextMenu: FieldContextMenu() },
};

export const OPERATION_FIELDS = {
	name: { name: 'name', label: 'Name', units: '', input: StringInput },

	filterFillColor: { name: 'filterFillColor', label: 'Filter Fill', units: '', input: FilterInput },
	filterStrokeColor: { name: 'filterStrokeColor', label: 'Filter Stroke', units: '', input: FilterInput },
	direction: { name: 'direction', label: 'Direction', units: '', input: DirectionInput, contextMenu: FieldContextMenu() },

	laserPower: { name: 'laserPower', label: 'Laser Power', units: '%', input: NumberInput, ...checkPercent, contextMenu: FieldContextMenu() },
	laserPowerMin: { name: 'laserPowerMin', label: 'Laser Power Min', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
	laserPowerMax: { name: 'laserPowerMax', label: 'Laser Power Max', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
	laserPowerCutoff: { name: 'laserPowerCutoff', label: 'Laser Power Cutoff', units: '%', input: NumberInput, ...checkRange(0, 100), contextMenu: FieldContextMenu() },
	laserDiameter: { name: 'laserDiameter', label: 'Laser Diameter', units: 'mm', input: NumberInput, ...checkPositive, contextMenu: FieldContextMenu() },
	lineDistance: { name: 'lineDistance', label: 'Line Distance', units: 'mm', input: NumberInput, ...checkPositive, contextMenu: FieldContextMenu() },
	lineAngle: { name: 'lineAngle', label: 'Line Angle', units: 'deg', input: NumberInput, contextMenu: FieldContextMenu() },
	toolDiameter: { name: 'toolDiameter', label: 'Tool Diameter', units: 'mm', input: NumberInput, ...checkToolDiameter, contextMenu: FieldContextMenu() },
	toolAngle: { name: 'toolAngle', label: 'Tool Angle', units: 'deg', input: NumberInput, ...checkToolAngle, contextMenu: FieldContextMenu() },

	margin: { name: 'margin', label: 'Margin', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
	passes: { name: 'passes', label: 'Passes', units: '', input: NumberInput, ...checkPositiveInt, contextMenu: FieldContextMenu() },
	cutWidth: { name: 'cutWidth', label: 'Final Cut Width', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
	stepOver: { name: 'stepOver', label: 'Step Over', units: '%', input: NumberInput, ...checkStepOver, contextMenu: FieldContextMenu() },
	passDepth: { name: 'passDepth', label: 'Pass Depth', units: 'mm', input: NumberInput, ...checkPassDepth, ...ifUseZ, contextMenu: FieldContextMenu() },
	millRapidZ: { name: 'millRapidZ', label: 'Rapid Z', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu() },
	millStartZ: { name: 'millStartZ', label: 'Start Z', units: 'mm', input: NumberInput, ...checkMillStartZ, contextMenu: FieldContextMenu() },
	millEndZ: { name: 'millEndZ', label: 'End Z', units: 'mm', input: NumberInput, ...checkMillEndZ, contextMenu: FieldContextMenu() },
	startHeight: { name: 'startHeight', label: 'Start Height', units: 'mm', input: NumberInput, contextMenu: FieldContextMenu(), ...checkZHeight, ...ifUseZ },
	segmentLength: { name: 'segmentLength', label: 'Segment', units: 'mm', input: NumberInput, ...checkGE0, contextMenu: FieldContextMenu() },
	ramp: { name: 'ramp', label: 'Ramp Plunge', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },

	plungeRate: { name: 'plungeRate', label: 'Plunge Rate', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('Z'), contextMenu: FieldContextMenu() },
	cutRate: { name: 'cutRate', label: 'Cut Rate', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY'), contextMenu: FieldContextMenu() },
	toolSpeed: { name: 'toolSpeed', label: 'Tool Speed (0=Off)', units: 'rpm', input: NumberInput, ...checkFeedRateRange('S'), contextMenu: FieldContextMenu() },

	useA: { name: 'useA', label: 'Use A Axis', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },
	aAxisDiameter: { name: 'aAxisDiameter', label: 'A Diameter', units: 'mm', input: NumberInput, ...checkPositive, ...ifUseA, contextMenu: FieldContextMenu() },

	useBlower: { name: 'useBlower', label: 'Use Air Assist', units: '', input: ToggleInput, ...ifUseBlower, contextMenu: FieldContextMenu() },
	useFluid: { name: 'useFluid', label: 'Use Fluid Assist', units: '', input: ToggleInput, ...ifUseFluid, contextMenu: FieldContextMenu() },

	smoothing: { name: 'smoothing', label: 'Smoothing', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: Smoothing the input image ?
	brightness: { name: 'brightness', label: 'Brightness', units: '', input: NumberInput, ...checkRange(-255, 255) },   // lw.raster-to-gcode: Image brightness [-255 to +255]
	contrast: { name: 'contrast', label: 'Contrast', units: '', input: NumberInput, ...checkRange(-255, 255) },         // lw.raster-to-gcode: Image contrast [-255 to +255]
	gamma: { name: 'gamma', label: 'Gamma', units: '', input: NumberInput, ...checkRange(0, 7.99) },                    // lw.raster-to-gcode: Image gamma correction [0.01 to 7.99]
	grayscale: { name: 'grayscale', label: 'Grayscale', units: '', input: GrayscaleInput },                             // lw.raster-to-gcode: Graysale algorithm [none, average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
	shadesOfGray: { name: 'shadesOfGray', label: 'Shades', units: '', input: NumberInput, ...checkRange(2, 256) },      // lw.raster-to-gcode: Number of shades of gray [2-256]
	invertColor: { name: 'invertColor', label: 'Invert Color', units: '', input: ToggleInput },                         // lw.raster-to-gcode
	trimLine: { name: 'trimLine', label: 'Trim Pixels', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },                                // lw.raster-to-gcode: Trim trailing white pixels
	joinPixel: { name: 'joinPixel', label: 'Join Pixels', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: Join consecutive pixels with same intensity
	burnWhite: { name: 'burnWhite', label: 'Burn White', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },   // lw.raster-to-gcode: [true = G1 S0 | false = G0] on inner white pixels
	verboseGcode: { name: 'verboseGcode', label: 'Verbose GCode', units: '', input: ToggleInput },                      // lw.raster-to-gcode: Output verbose GCode (print each commands)
	vertical: { name: 'vertical', label: 'Vertical', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },       // lw.raster-to-gcode: Go Vertically or reverse diagonally
	diagonal: { name: 'diagonal', label: 'Diagonal', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },       // lw.raster-to-gcode: Go diagonally (increase the distance between points)
	dithering: { name: 'dithering', label: 'Dithering', units: '', input: ToggleInput, contextMenu: FieldContextMenu() },     // lw.raster-to-gcode: dither image
	overScan: { name: 'overScan', label: 'Over Scan', units: 'mm', input: NumberInput, ...checkGE0, contextMenu: FieldContextMenu() },  // lw.raster-to-gcode: This feature add some extra white space before and after each line. This leaves time to reach the feed rate before starting to engrave and can prevent over burning the edges of the raster.

	latheToolBackSide: { name: 'latheToolBackSide', label: 'Tool Back Side', input: ToggleInput },
	latheRapidToDiameter: { name: 'latheRapidToDiameter', label: 'Rapid To Diameter', units: 'mm', input: NumberInput, ...checkPositive },
	latheRapidToZ: { name: 'latheRapidToZ', label: 'Rapid To Z', units: 'mm', input: NumberInput },
	latheStartZ: { name: 'latheStartZ', label: 'Start Z', units: 'mm', input: NumberInput, ...checkLatheStartZ },
	latheRoughingFeed: { name: 'latheRoughingFeed', label: 'Roughing Feed', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY') },
	latheRoughingDepth: { name: 'latheRoughingDepth', label: 'Roughing Depth', units: 'mm', input: NumberInput, ...checkPositive },
	latheFinishFeed: { name: 'latheFinishFeed', label: 'Finish Feed', units: 'mm/min', input: NumberInput, ...checkFeedRateRange('XY') },
	latheFinishDepth: { name: 'latheFinishDepth', label: 'Finish Depth', units: 'mm', input: NumberInput, ...checkGE0 },
	latheFinishExtraPasses: { name: 'latheFinishExtraPasses', label: 'Finish Extra Passes', input: NumberInput, ...checkGE0Int },
	latheFace: { name: 'latheFace', label: 'Face', input: ToggleInput },
	latheFaceEndDiameter: { name: 'latheFaceEndDiameter', label: 'Face End Diameter', units: 'mm', input: NumberInput, ...checkLatheFaceEndDiameter },
	latheTurnAdd: { name: 'latheTurnAdd', buttonLabel: 'Add Turn', input: ButtonInput, wide: true, ...latheTurnAdd },
	latheTurns: { name: 'latheTurns', input: TableInput, fields: OPERATION_LATHE_TURN_FIELDS, remove: operationLatheTurnRemove, wide: true },

	hookOperationStart: { name: 'hookOperationStart', label: 'Pre Op', units: '', input: TagInput('settings.macros') },
	hookOperationEnd: { name: 'hookOperationEnd', label: 'Post Op', units: '', input: TagInput('settings.macros') },
	hookPassStart: { name: 'hookPassStart', label: 'Pre Pass', units: '', input: TagInput('settings.macros') },
	hookPassEnd: { name: 'hookPassEnd', label: 'Post Pass', units: '', input: TagInput('settings.macros') },
};

export const OPERATION_GROUPS = {
	'Filters': {
		collapsible: false,
		fields: ['smoothing', 'brightness', 'contrast', 'gamma', 'grayscale', 'shadesOfGray', 'invertColor', 'dithering']
	},
	'Macros': {
		collapsible: true,
		fields: ['hookOperationStart', 'hookOperationEnd', 'hookPassStart', 'hookPassEnd']
	}
}

export const OPERATION_TYPES = {
	'Laser Cut': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserPower', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
	'Laser Cut Inside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
	'Laser Cut Outside': { allowTabs: true, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'laserDiameter', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', 'segmentLength', ...OPERATION_GROUPS.Macros.fields] },
	'Laser Fill Path': { allowTabs: false, tabFields: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'lineDistance', 'lineAngle', 'laserPower', 'margin', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useA', 'aAxisDiameter', 'useBlower', ...OPERATION_GROUPS.Macros.fields] },
	'Laser Raster': {
		allowTabs: false, tabFields: false, fields: [
			'name', 'laserPowerMin', 'laserPowerMax', 'laserPowerCutoff', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower',
			'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'vertical', 'diagonal', 'overScan', 'useA', 'aAxisDiameter',
			...OPERATION_GROUPS.Filters.fields, ...OPERATION_GROUPS.Macros.fields
		]
	},
	'Laser Raster Merge': {
		allowTabs: false, tabFields: false, fields: [
			'name', 'filterFillColor', 'filterStrokeColor',
			'laserPowerMin', 'laserPowerMax', 'laserPowerCutoff', 'laserDiameter', 'passes', 'passDepth', 'startHeight', 'cutRate', 'useBlower',
			'trimLine', 'joinPixel', 'burnWhite', 'verboseGcode', 'vertical', 'diagonal', 'overScan', 'useA', 'aAxisDiameter',
			...OPERATION_GROUPS.Filters.fields, ...OPERATION_GROUPS.Macros.fields
		]
	},
	'Mill Pocket': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'stepOver', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
	'Mill Cut': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'toolDiameter', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
	'Mill Cut Inside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'useFluid', 'segmentLength', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
	'Mill Cut Outside': { allowTabs: true, tabFields: true, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'margin', 'toolSpeed', 'millRapidZ', 'millStartZ', 'millEndZ', 'passDepth', 'cutWidth', 'toolDiameter', 'stepOver', 'plungeRate', 'cutRate', 'useFluid', 'segmentLength', 'ramp', 'hookOperationStart', 'hookOperationEnd'] },
	'Mill V Carve': { allowTabs: false, fields: ['name', 'filterFillColor', 'filterStrokeColor', 'direction', 'toolAngle', 'millRapidZ', 'millStartZ', 'toolSpeed', 'passDepth', 'segmentLength', 'plungeRate', 'cutRate', 'useFluid', 'hookOperationStart', 'hookOperationEnd'] },
	'Lathe Conv Face/Turn': { skipDocs: true, tabFields: false, fields: ['name', 'latheToolBackSide', 'latheRapidToDiameter', 'latheRapidToZ', 'latheStartZ', 'latheRoughingFeed', 'latheRoughingDepth', 'latheFinishFeed', 'latheFinishDepth', 'useFluid', 'latheFinishExtraPasses', 'latheFace', 'latheFaceEndDiameter', 'latheTurnAdd', 'latheTurns', 'hookOperationStart', 'hookOperationEnd'] },
};
