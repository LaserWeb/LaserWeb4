import React from 'react'
import ReactDOM from 'react-dom'
import { connect, dispatch } from 'react-redux'
import { addMaterial, setMaterialAttrs, deleteMaterial,toggleMaterialView,toggleMaterialEdit,
        addMaterialOperation, deleteMaterialOperation, setMaterialOperationAttrs,  toggleMaterialOperationEdit,
        uploadMaterialDatabase, downloadMaterialDatabase } from '../actions/material-database.js'


import * as operation from './operation'

import {Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse, InputGroup} from 'react-bootstrap'
import {FileField} from './forms'

import * as FlexData from 'react-flex-data';
import Icon from './font-awesome';
import stringify from 'json-stringify-pretty-compact';

import { materialTreeToTabular, materialTabularToTree, arr2csv, csv2arr} from '../lib/material-database';

import Select from 'react-select';

import {FileStorage, LocalStorage} from '../lib/storages';

import Validator from 'validatorjs';
import {GlobalStore} from '../index';

export const MATERIALDATABASE_VALIDATION_RULES = {
    thickness: 'numeric|min:0.1',
    name: 'required'
}


export function ValidateMaterial(bool=true, rules=MATERIALDATABASE_VALIDATION_RULES, data=null) {

    if (!data)
        data=Object.assign({},GlobalStore().getState().materialdatabase)

    let check = new Validator(data, rules );
    
    if (bool) 
        return check.passes();
    
    return check;
}

class FullSizeModal extends React.Component {
    
    render(){
        return (
            <Modal show={this.props.modal.show} onHide={this.props.modal.onHide} bsSize="large" aria-labelledby="contained-modal-title-lg" className="full-width">
            <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title-lg">{this.props.modal.header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {this.props.children}
            </Modal.Body>
            <Modal.Footer>
              {this.props.footer}
            </Modal.Footer>
          </Modal>
        )
    }
}


class TableRow extends React.Component {
  
  
  render(){
    let childIndex=this.props.childIndex;
    let isOpened=(this.props.collapseContent) ? this.props.collapseContent.props.isOpened : undefined
    
    let props=Object.assign({},this.props)
        props.rowClass += (this.props.collapseContent)? " collapsible" : "";
        props.rowClass += (isOpened)? " opened" : "";
    
    let events={}
    if (this.props.onRowClick){
       events={
            onDoubleClick: (e)=>this.props.onRowClick(e,childIndex),
            onClick: (e)=>this.props.onRowClick(e,childIndex)
       }
    }
    
    return (
      <div  style={this.props.style}>
      <div {...events}><FlexData.TableRow {...props} >{this.props.children}</FlexData.TableRow></div>
      <Collapse in={isOpened}><div className="nestedTableWrapper">{this.props.collapseContent}</div></Collapse>
      </div>
    )
  }
}



class Table extends React.Component {
    
    constructor(props){
        super(props);
        this.state={selectedIndex:false}
    }
    
    render(){
        
        let handleSelect=(e,rowIndex)=>{
            this.setState({selectedIndex: rowIndex});
        }

        return (
            <div> 
            <FlexData.Table {...this.props } altColor="none">
                {(this.props.header)? <caption>{this.props.header}</caption> : undefined}
                
                <FlexData.TableHeader rowClass="flexTHead">
                   {this.props.columns.map((column) => <FlexData.TableHeaderColumn columnClass={"column "+column.id} key={column.id}>{column.label}</FlexData.TableHeaderColumn>)}
                   
                </FlexData.TableHeader>
                <FlexData.TableBody bodyClass="flexTBody">
                    {this.props.data.map((row, i) => {
                        
                        let style=(!(i%2)) ? {backgroundColor:this.props.altColor} : undefined
                        
                        
                        
                        if (this.state.selectedIndex===i) {
                            style = {backgroundColor:this.props.selectColor}
                        }
                        
                        return (
                            <TableRow key={i}
                                childIndex={i}
                                collapseContent={this.props.data[i].collapseContent}
                                style={style}
                                
                                onRowClick={this.props.onRowClick}
                                rowClass="tableRow"
                            >
                                
                                {this.props.columns.map((column,j) => <FlexData.TableRowColumn key={column.id} columnClass={"column "+column.id} >
                                {(!j && this.props.data[i].collapseContent) ? (<div style={{float:"left"}}><Icon name={(this.props.data[i].collapseContent.props.isOpened)? "minus-square-o":"plus-square-o"}/>&nbsp;</div>) : undefined}    
                                {this.props.data[i][column.id]}</FlexData.TableRowColumn>)}
                                
                            </TableRow>
                        );
                    })}
                </FlexData.TableBody>
            </FlexData.Table>
            </div>
        );
    }
    
}

function MaterialActions({isEditable=false, onDelete=null, onEdit=null, onAppend=null }){
    return (<ButtonGroup>
        
        
        <Button onClick={onEdit} bsSize="xsmall" bsStyle={isEditable? "default":"info"}><Icon name="pencil-square-o"/></Button>
        {(onDelete)? (<Button onClick={onDelete} bsSize="xsmall" bsStyle="danger"><Icon name="trash"/></Button>) :undefined}
        
        </ButtonGroup>)
}

class MaterialOperationsDropdown extends React.Component {
    
    constructor(props){
        super(props);
        this.state={selected:""}
        this.handleSelect.bind(this)
        this.handleClick.bind(this)
    }
    
    handleClick(e){
        if (this.state.selected)
            this.props.onApply(this.state.selected, this.props.selectedProfile)
    }
    
    handleSelect(e){
        this.setState({selected:e.target.value})
    }
    
    render(){
        return (
            
            
            <FormGroup>
            <ControlLabel>Select a Material Operation to add</ControlLabel>
            
            <InputGroup>
                
                <FormControl componentClass="select" placeholder="Operation type" ref="select" onChange={(e)=>this.handleSelect(e)}>
                    <option key="__" value="">Select a Operation Type</option>
                {Object.keys(operation.types).map((item,i)=>{return <option key={i} value={item}>{item}</option>})}        
                </FormControl>
                <InputGroup.Button>
                        <Button bsClass="btn btn-success" onClick={(e)=>{this.handleClick(e)}}><Icon name="share" /></Button>
                </InputGroup.Button>
            </InputGroup>
            </FormGroup>
            
        )
    }
    
}

MaterialOperationsDropdown = connect((state)=>{
        return {
            selectedProfile: state.settings.__selectedProfile || "*"
        }
})(MaterialOperationsDropdown)



class MaterialOperations extends React.Component {

 
    constructor(props){
        super(props)
        this.handleCellChange.bind(this)
        this.handleRowEdit.bind(this)
        this.handleRowDelete.bind(this)
        this.handleRowAppend.bind(this)
    }
    
    handleCellChange(operationIndex, paramKey, paramValue ){
        this.props.handleCellChange(this.props.materialId, operationIndex, {[paramKey]:paramValue} );
    }
    
    handleRowEdit( operationIndex) {
        this.props.handleRowEdit(this.props.materialId, operationIndex);
    }
    
    handleRowDelete( operationIndex) {
        this.props.handleRowDelete(this.props.materialId, operationIndex);
    }
    
    handleRowAppend( operationType, machineProfile=null) {
        
        this.props.handleRowAppend(this.props.materialId, operationType, machineProfile);
    }
 
    render(){
        const operations=this.props.operations
        const rest = this.props;
        
        
        let shouldShow = (operation, filter)=>{
                if (!filter)
                        return true;
                if (filter === "*" || operation.machine_profile === null)
                        return true;

                return filter.split(",").includes(operation.machine_profile)
                
        }
        
            let data={};
            let tables={};
            operations.forEach((_operation, _operationindex)=>{
                
                if (!shouldShow(_operation, this.props.profileFilter)) return;
                
                
                /*Takes the type of operation from operation::types*/
                let currentOperation=operation.types[_operation.type]
                
                /*Extracts the column names from operation::fields*/
                let columns= [{id: "_name", label: _operation.type}];
                
                currentOperation.fields.forEach((key)=>{
                    let currentParam = operation.fields[key];
                    columns.push({id: key, label: currentParam.label+ ((currentParam.units)? " ("+currentParam.units+")":"")})
                })
                
                columns.push({id: "_actions", label: ""})
                
                /*Assigns a table for each kind of operation available for that material*/
                tables[_operation.type]=columns;
                
                if (typeof  data[_operation.type] =='undefined')
                     data[_operation.type]=[];
                
                
                let fields={}
                
                
                if (_operation.isEditable){
                    //writes operation[i][key]
                    fields['_name']=<div><input type="text" key="name" value={_operation.name} onChange={(e)=>{this.handleCellChange(this.props.materialId, _operationindex, "name", e.target.value)}} /></div>
                } else {
                    fields['_name']=<div><strong>{_operation.name}</strong>{(_operation.machine_profile) ? <small><code>{_operation.machine_profile}</code></small> : undefined}</div>
                }
                
                
                currentOperation.fields.forEach((key)=>{
                       let currentParam = operation.fields[key];
                       let FieldType= currentParam.input
                       let hasError= currentParam.check ? !currentParam.check(_operation.params[currentParam.name]) :false                     
                       
                       let className=[FieldType.name];
                                
                       if (hasError)
                                className.push("has-error")
                       
                       if (_operation.isEditable){
                        //writes operation.params[i][key]
                        fields[key]    = <div className={className.join(" ")} title={hasError? currentParam.error:undefined}>
                                                <FieldType key={currentParam.name} op={_operation.params} field={currentParam} style={{}}
                                                           onChangeValue={(v)=>{this.handleCellChange( _operationindex, "params", {[key]:v})}} />
                                        </div>
                       } else {
                        fields[key]    = <div className={className.join(" ")} title={hasError? currentParam.error:undefined}>{_operation.params[currentParam.name] || ""}</div>
                        
                       }
                });
                
                if (this.props.canEdit){
                       fields['_actions'] = <MaterialActions
                                                isEditable={_operation.isEditable}
                                                onEdit={(e)=>{this.handleRowEdit(_operationindex)}}
                                                onDelete={(e)=>{this.handleRowDelete(_operationindex)}}
                                                />
                }
                
                
                data[_operation.type].push(fields)
                
            });
            
           let result=[];
            Object.entries(tables).forEach((item,i)=>{
                let [type,columns] = item;
                let columnRatio=[...Array(columns.length-1).fill(1).fill(2,0,1),0]
                result.push(<Table key={i} columns={columns} data={data[type]} rowHeight={36} columnRatio={columnRatio}/>)
            })
            
            return(<div className="materialOperations">{result}
            <div className="well well-sm">
            <MaterialOperationsDropdown onApply={(operationType, machineProfile)=>this.handleRowAppend(operationType, machineProfile)}/>
            </div>
            </div>);
        
    }
   
}

MaterialOperations = connect(null,(dispatch) =>{
    return {
        handleCellChange: (materialId, operationIndex, attrs ) => {
            dispatch(setMaterialOperationAttrs(materialId, operationIndex, attrs));
        },
        handleRowEdit: (materialId, operationIndex) => {
            dispatch(toggleMaterialOperationEdit(materialId, operationIndex));
        },
        handleRowDelete: (materialId, operationIndex) =>{
            if (confirm("Are you sure?"))  dispatch(deleteMaterialOperation(materialId, operationIndex));
        },
        handleRowAppend: (materialId, operationType, machineProfile) => {
            dispatch(addMaterialOperation(materialId, operationType,machineProfile));
        }
    }
    
})(MaterialOperations)

class Material extends React.Component {
    
    constructor(props){
        super(props);
        this.handleRowClick.bind(this)
        this.handleRowEdit.bind(this)
        this.handleRowDelete.bind(this)
        this.handleCellChange.bind(this)
    }
    
    handleRowClick(e,rowIndex){
        switch (e.type) {
            case "dblclick":
                this.props.handleToggle(this.props.data.id)
        }
    }
    
    handleRowEdit(e){
        this.props.handleRowEdit(this.props.data.id);
    }
    
    handleRowDelete(e){
        this.props.handleRowDelete(this.props.data.id);
    }
    
    handleCellChange(e, attr) {
        this.props.handleCellChange(this.props.data.id, {[attr]:e.target.value})
    }
    
    render(){
        
        let columns=[
            {id:"name",label:"Name"},
            {id:"thickness",label:"Thickness (mm)"},
            {id:"notes",label:"Notes"},
            {id:"_actions",label:<Icon name="cogs"/>}
        ];
        
        let validator = ValidateMaterial(false, MATERIALDATABASE_VALIDATION_RULES, this.props.data.material)
            validator.passes();
        let hasError=(name) => {return validator.errors.errors[name];}
        
        let row={};
        if (this.props.data.material.isEditable){
            row={
                name:       <div title={hasError('name')} className={hasError('name')? 'has-error':undefined}><input type="text" value={this.props.data.material.name} onChange={(e)=>{this.handleCellChange(e, "name")}} /></div>,
                thickness:  <div title={hasError('thickness')} className={hasError('thickness')? 'has-error':undefined}><input type="text" value={this.props.data.material.thickness} onChange={(e)=>{this.handleCellChange(e, "thickness")}} /></div>,
                notes:      <div title={hasError('notes')} className={hasError('notes')? 'has-error':undefined}><input type="text" value={this.props.data.material.notes} onChange={(e)=>{this.handleCellChange(e, "notes")}} /></div>
            }
        } else {
            row={
                    name: this.props.data.material.name,
                    thickness: this.props.data.material.thickness,
                    notes: this.props.data.material.notes,
            }
            
        }
        
            row["collapseContent"] = <MaterialOperations operations={this.props.data.operations} materialId={this.props.data.id} isOpened={this.props.data.isOpened} canEdit={!this.props.data.material.isEditable} profileFilter={this.props.profileFilter} />;
        
        row["_actions"] = <MaterialActions
                                                    isEditable={this.props.data.material.isEditable}
                                                    onEdit={(e)=>{this.handleRowEdit(e)}}
                                                    onDelete={(e)=>{this.handleRowDelete(e)}}
                                                    
                                                    />
        
        return (<Table columns={columns} data={[row]} rowHeight={36} tableClass="flexTable" columnRatio={[2,1,5]} onRowClick={(e, rowIndex)=>{this.handleRowClick(e,rowIndex)}}/>);
    }
}



Material = connect(null, (dispatch)=>{
    return {
        
        handleToggle: (materialId) => {
            dispatch(toggleMaterialView(materialId))
        },
        handleCellChange: (materialId, attrs ) => {
            dispatch(setMaterialAttrs(materialId, attrs));
        },
        handleRowEdit: (materialId) => {
             dispatch(toggleMaterialEdit(materialId));
        },
        handleRowDelete: (materialId) => {
             if (confirm("Are you sure?")) dispatch(deleteMaterial(materialId));
        }
    }    
    
} )(Material);

class MaterialMachineProfile extends React.Component
{
    
    render(){
        let {profiles, selected, onChange, blank="*", label="Profile Filter", ...rest} = this.props;
        let options = Object.entries(profiles).map((entry)=>{let [value,item] = entry; return {value,label: item.machineLabel}});
        return <Select multi simpleValue delimiter="," value={selected} placeholder={label} options={options} onChange={(v)=>{onChange(v)}} />
    }
    
}



class MaterialDatabaseEditor extends React.Component {
    
    constructor(props){
        super(props);
        this.state={selected: this.props.selectedProfile}
        this.handleProfileSelect.bind(this)
        this.handleMaterialChange.bind(this)
        this.handleAddMaterial.bind(this)
        this.handleExport.bind(this)
    }
    
    handleProfileSelect(value) {
        this.setState({selected:value})
    }
    
    handleMaterialChange(data){
        console.log(data)
    }
    
    handleAddMaterial(e){
        this.props.handleAddMaterial();
    }
    
    handleExport(e, format){
        this.props.handleDownload(this.props.materials, format)
    }
    
    
    render(){
     
        
        
        return (
            <FullSizeModal modal={{show:this.props.show, onHide:this.props.onHide, header:"Material Database"}}
                footer={<ButtonToolbar>
                    <Button bsStyle="primary" onClick={(e)=>this.handleAddMaterial(e)}>Add new material</Button>
                    <Button bsStyle="info" onClick={(e)=>this.handleExport(e,'json')}><Icon name="download"/> .json</Button>
                    <Button bsStyle="info" onClick={(e)=>this.handleExport(e,'csv')}><Icon name="download"/> .csv</Button>
                    <FileField label="" dispatch={(e) => this.props.handleUpload(e.target.files[0],uploadMaterialDatabase)}   buttonClass="btn btn-danger"/>
                </ButtonToolbar>}
            >
            <MaterialMachineProfile profiles={this.props.profiles} selected={this.state.selected} onChange={(value)=>{this.handleProfileSelect(value)}}/>
              
              <div className="materialList">
              {this.props.materials.map((item)=>{
                   return (<Material key={item.id} data={item} onChange={(data)=>this.handleMaterialChange(data)} profileFilter={this.state.selected}/>)
              })}
              </div>
              <hr/>
              
              
            </FullSizeModal>
         )
        
    }
    
}


const mapStateToProps = (state)=>{
    
    return {
        profiles: state.machineProfiles,
        materials: state.materialDatabase,
        selectedProfile: state.settings.__selectedProfile || "*"
    }
    
}

const mapDispatchToProps = (dispatch) => {
    return {
        handleAddMaterial: () => {
            dispatch(addMaterial())
        },
        handleDownload:(materials, format) => {
            if (format=='json') {
                FileStorage.save('laserweb-materials', stringify(materials),"application/json" );
            } else if (format=='csv') {
                FileStorage.save('laserweb-materials', arr2csv(materialTreeToTabular(materials)),"text/csv" );
            }
            dispatch(downloadMaterialDatabase(materials))
        },
        handleUpload:(name, action)=>{
            FileStorage.load(name, (file, result) => dispatch(action(file, result)));
        }
        
    }
}

MaterialDatabaseEditor = connect(mapStateToProps, mapDispatchToProps)(MaterialDatabaseEditor)


export class MaterialDatabaseButton extends React.Component {
    
    constructor(props) {
        super(props);
        this.state={showModal:false}
    }
    
    render() {
        let closeModal = () => this.setState({ showModal: false });
        return (
            <div>
            <Button bsStyle="primary" block onClick={()=>this.setState({ showModal: true })}>{this.props.label}</Button>
            <MaterialDatabaseEditor show={this.state.showModal} onHide={closeModal}/>
            </div>
        )
    }
}



