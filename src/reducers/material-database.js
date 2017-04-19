
import omit from 'object.omit'
import { deepMerge } from "../lib/helpers"
import generateName from 'sillyname'
import uuid from 'node-uuid';

import { actionTypes } from 'redux-localstorage'

import { OPERATION_INITIALSTATE } from './operation'

import CommandHistory from '../components/command-history'

export const MATERIALDB_INITIALSTATE = require("../data/lw.materials/material-database.json");

function generateInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const GROUP_TEMPLATE = () => {
    return {
        id: uuid.v4(),
        name: generateName(),
        notes: "",
        template: PRESET_TEMPLATE('Laser Cut'),
        presets: []
    }
}

const PRESET_TEMPLATE = (type, machineProfile = null) => {
    return {
        id: uuid.v4(),
        name: "** " + generateName() + " **",
        notes: "",
        type: type,
        machine_profile: machineProfile,
        params: OPERATION_INITIALSTATE
    }
}

export const DEFAULT_GROUPING_NAME = '__SAVES__';


const togglePresetAttribute = (state, id, attribute, processPreset = null) => {
    return state.map((group) => {
        if (!group.presets || !group.presets.find((preset) => { return preset.id === id }))
            return group;

        group.presets = group.presets.map((preset, i) => {
            if (preset.id !== id)
                return preset;

            if (typeof preset[attribute] == "undefined")
                preset[attribute] = false;

            preset[attribute] = !preset[attribute];

            if (processPreset)
                preset = processPreset(preset)

            return preset;

        })

        return group;
    })
}

const toggleGroupAttribute = (state, id, attribute, processGroup = null) => {
    return state.map((group) => {
        if (group.id !== id)
            return group;
        if (typeof group[attribute] == "undefined")
            group[attribute] = false;

        group[attribute] = !group[attribute];

        if (processGroup)
            group = processGroup(group)

        return group;
    })
}


export const materialDatabase = (state = MATERIALDB_INITIALSTATE, action) => {


    switch (action.type) {

        case "MATERIALDB_UPLOAD":
            return action.payload.database;

        case "MATERIALDB_DOWNLOAD":
            return state;

        case "MATERIALDB_GROUP_ADD":
            state = [...state, GROUP_TEMPLATE()];
            return state;

        case "MATERIALDB_GROUP_DELETE":
            return state.filter((group) => {
                return (group.id !== action.payload);
            })

        case "MATERIALDB_GROUP_SET_ATTRS":
            return state.map((group) => {
                if (group.id !== action.payload.groupId)
                    return group;

                let attrs = omit(action.payload.attrs, ['id', 'presets']); // dont overwrite id,presets
                group = deepMerge(group, attrs)
                return group;
            })

        case "MATERIALDB_GROUP_TOGGLE_VIEW":
            return toggleGroupAttribute(state, action.payload, 'isOpened');

        case "MATERIALDB_GROUP_TOGGLE_EDIT":

            //disable children edit.
            const processGroup = (group) => {
                if (group.isEditable) {
                    group.presets = group.presets.map((preset, i) => {
                        preset.isEditable = false;
                        return preset;
                    })
                }
                return group;
            }

            return toggleGroupAttribute(state, action.payload, 'isEditable', processGroup)

        case "MATERIALDB_PRESET_ADD":
            return state.map((group) => {
                if (group.id !== action.payload.groupId)
                    return group;

                let template = group.template || {};
                let attrs = action.payload.attrs || {};
                group.presets = [...group.presets, Object.assign(PRESET_TEMPLATE(), omit(template, ['id', 'name']), omit(attrs, ['id']))]

                return group;
            });

        case "MATERIALDB_PRESET_SET_ATTRS":
            return state.map((group) => {
                if (!group.presets || !group.presets.find((preset) => { return preset.id === action.payload.presetId }))
                    return group;


                group.presets = group.presets.map((preset) => {
                    if (preset.id !== action.payload.presetId)
                        return preset;
                    return deepMerge(preset, action.payload.attrs)

                })

                return group;
            })


        case "MATERIALDB_PRESET_DELETE":
            return state.map((group) => {
                if (!group.presets || !group.presets.find((preset) => { return preset.id === action.payload }))
                    return group;

                group.presets = group.presets.filter((preset, i) => { return (preset.id !== action.payload) })

                return group;
            })


        case "MATERIALDB_PRESET_TOGGLE_EDIT":
            return togglePresetAttribute(state, action.payload, 'isEditable')

        case "MATERIALDB_PRESET_NEW":
            const grouping_name = action.payload.grouping || DEFAULT_GROUPING_NAME;
            let groupings = state.slice();
            let grouping = groupings.find((grouping) => (grouping.name === grouping_name))

            if (!grouping) {
                grouping = Object.assign(GROUP_TEMPLATE(), { name: grouping_name })
                groupings.push(grouping);
            }
            let preset_name = action.payload.preset.name || action.payload.name || ("** " + generateName() + " **");
            let existingPreset = grouping.presets.find((preset) => preset.name === preset_name);
            if (!existingPreset) {
                
                let attrs = Object.assign(
                                PRESET_TEMPLATE(action.payload.preset.type), 
                                { name:  preset_name, params: action.payload.preset}
                             );
                CommandHistory.write(`Creating preset "${preset_name}" into grouping "${grouping.name}"`,CommandHistory.SUCCESS)
                return materialDatabase(groupings, { type: 'MATERIALDB_PRESET_ADD', payload: { groupId: grouping.id, attrs } })
            } else {
                CommandHistory.warn(`Updating preset "${existingPreset.name}" of grouping "${grouping.name}"`)
                return materialDatabase(groupings, { type: 'MATERIALDB_PRESET_SET_ATTRS', payload: { presetId: existingPreset.id, attrs: { params: action.payload.preset} } })
            }

        case actionTypes.INIT:
            if (action.payload) {
                let lockedState = MATERIALDB_INITIALSTATE.slice().map((vendor) => { return { ...vendor, _locked: true } });
                return Object.assign(action.payload.materialDatabase, lockedState);
            }
            return state;

        default:
            return state;
    }

}
