
import omit from 'object.omit'
import {deepMerge} from "../lib/helpers"
import generateName from 'sillyname'
import uuid from 'node-uuid';

const initialState = require("../data/material-database.json");

import {types} from "../components/operation";

function generateInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const BRANCH_TEMPLATE=()=>{
    return {
        id: uuid.v4(),
        name: generateName(),
        notes:"",
        template: LEAF_TEMPLATE('Laser Cut'),
        leafs:[]
    }
}

const LEAF_TEMPLATE=(type, machineProfile=null)=>{
    return {
        id: uuid.v4(),
        name: "** "+generateName()+" **",
        notes:"",
        type:type,
        machine_profile:machineProfile,
        params:{}
    }
}


const toggleLeafAttribute = (state, id, attribute, processLeaf=null) => {
    return state.map((branch) => {
        if (!branch.leafs || !branch.leafs.find((leaf)=>{ return leaf.id === id})) 
            return branch;
        
        branch.leafs=branch.leafs.map((leaf,i)=> {
                if (leaf.id!==id)
                    return leaf;
                
                if (typeof leaf[attribute] == "undefined")
                    leaf[attribute]=false;
                
                leaf[attribute]=!leaf[attribute];
                
                if (processLeaf)
                    leaf = processLeaf(leaf)

                return leaf;
                
        })
        
        return branch;
    })
}

const toggleBranchAttribute = (state, id,  attribute, processBranch=null) => {
    return state.map((branch) => {
        if (branch.id !== id)
            return branch;
        if (typeof branch[attribute] == "undefined")
            branch[attribute]=false;
            
        branch[attribute]=!branch[attribute];

        if (processBranch)
            branch = processBranch(branch)
        
        return branch;
    })
}


export const materialDatabase = (state = initialState, action) => {

    
        switch (action.type) {
          
            case "MATERIALDB_UPLOAD":
                return action.payload.database;
          
            case "MATERIALDB_DOWNLOAD":
                return state;
          
            case "MATERIALDB_BRANCH_ADD":
                state = [...state, BRANCH_TEMPLATE()];
                return state;
                
            case "MATERIALDB_BRANCH_DELETE":
                return state.filter((branch)=>{
                    return (branch.id !== action.payload);
                })
            
            case "MATERIALDB_BRANCH_SET_ATTRS":
                return state.map((branch) => {
                    if (branch.id !== action.payload.branchId)
                        return branch;
                    
                    let attrs=omit(action.payload.attrs, ['id','leafs']); // dont overwrite id,leafs
                    branch=deepMerge(branch, attrs )
                    return branch;
                })

            case "MATERIALDB_BRANCH_TOGGLE_VIEW" :
                return toggleBranchAttribute(state, action.payload, 'isOpened');

            case "MATERIALDB_BRANCH_TOGGLE_EDIT":

                //disable children edit.
                const processBranch=(branch)=>{
                    if (branch.isEditable){
                        branch.leafs=branch.leafs.map((leaf, i) =>{
                            leaf.isEditable=false;
                            return leaf;    
                        })
                    }
                    return branch;
                }

                return toggleBranchAttribute(state, action.payload, 'isEditable', processBranch )
            
            case "MATERIALDB_LEAF_ADD":
                return state.map((branch) => {
                    if (branch.id !== action.payload.branchId)
                        return branch;
                      
                    branch.leafs=[...branch.leafs, Object.assign(LEAF_TEMPLATE(),branch.template || {}, action.payload.attrs)]
                    
                    return branch;
                });

            case "MATERIALDB_LEAF_SET_ATTRS":
                return state.map((branch) => {
                    if (!branch.leafs || !branch.leafs.find((leaf)=>{ return leaf.id === action.payload.leafId})) 
                        return branch;
                    
                    
                    branch.leafs=branch.leafs.map((leaf)=> {
                            if (leaf.id!==action.payload.leafId)
                                return leaf;
                            return deepMerge(leaf, action.payload.attrs)
                            
                    })
                    
                    return branch;
                })

            
            case "MATERIALDB_LEAF_DELETE":
                return state.map((branch) => {
                    if (!branch.leafs || !branch.leafs.find((leaf)=>{ return leaf.id === action.payload})) 
                        return branch;
                    
                    branch.leafs=branch.leafs.filter((leaf,i)=> { return (leaf.id!==action.payload) })
                    
                    return branch;
                })
               
                
            case "MATERIALDB_LEAF_TOGGLE_EDIT":
                return toggleLeafAttribute(state, action.payload,'isEditable')
            
            default:
                return state;
        }
    
}
