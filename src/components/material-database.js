import uuid from 'node-uuid';

import React from 'react'
import ReactDOM from 'react-dom'
import {connect, dispatch} from 'react-redux'
import {setMaterialOperationAttrs, toggleMaterialView, toggleMaterialOperationEdit, toggleMaterialEdit, deleteMaterialOperation, deleteMaterial} from '../actions/material-database.js'


import * as operation from './operation'

import {Modal, Button, ButtonToolbar, ButtonGroup, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse} from 'react-bootstrap'
import * as FlexData from 'react-flex-data';
import Icon from './font-awesome';

import omit from 'object.omit';



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
              <Button onClick={this.props.modal.onHide}>Close</Button>
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
                <FlexData.TableBody bodyClass="flexTbody">
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
                                {(!j && this.props.data[i].collapseContent) ? ((this.props.data[i].collapseContent.props.isOpened) ? <Icon name="minus-square-o"/>: <Icon name="plus-square-o"/>) : undefined}    
                                &nbsp;{this.props.data[i][column.id]}</FlexData.TableRowColumn>)}
                                
                            </TableRow>
                        );
                    })}
                </FlexData.TableBody>
            </FlexData.Table>
            </div>
        );
    }
    
}

function MaterialActions({isEditable=false, onDelete=null, onEdit=null }){
    return (<ButtonGroup>
        {(isEditable && onDelete)? (<Button onClick={onDelete} bsSize="xsmall" bsStyle="danger"><Icon name="trash"/></Button>) :undefined}
        <Button onClick={onEdit} bsSize="xsmall" bsStyle={isEditable? "default":"info"}><Icon name="pencil-square-o"/></Button>
        </ButtonGroup>)
}


class MaterialOperations extends React.Component {

 
    constructor(props){
        super(props)
        this.handleCellChange.bind(this)
        this.handleRowEdit.bind(this)
    }
    
    handleCellChange(materialId, operationIndex, paramKey, paramValue ){
        this.props.handleCellChange(materialId, operationIndex, {[paramKey]:paramValue} );
    }
    
    handleRowEdit(materialId, operationIndex) {
        this.props.handleRowEdit(materialId, operationIndex);
    }
    
    handleRowDelete(materialId, operationIndex) {
        this.props.handleRowDelete(materialId, operationIndex);
    }
 
    render(){
        const operations=this.props.operations
        const rest = this.props;
        
            let data={};
            let tables={};
            operations.forEach((_operation, _operationindex)=>{
                /*Takes the type of operation from operation::types*/
                let currentOperation=operation.types[_operation.type]
                
                /*Extracts the column names from operation::fields*/
                let columns= [{id: "name", label: _operation.type}];
                
                currentOperation.fields.forEach((key)=>{
                    let currentParam = operation.fields[key];
                    columns.push({id: key, label: currentParam.label+" ("+currentParam.units+")"})
                })
                
                columns.push({id: "_actions", label: "Actions"})
                
                /*Assigns a table for each kind of operation available for that material*/
                tables[_operation.type]=columns;
                
                if (typeof  data[_operation.type] =='undefined')
                     data[_operation.type]=[];
                
                
                let fields={}
                // fields=_operation.params
                currentOperation.fields.forEach((key)=>{
                       let currentParam = operation.fields[key];
                       let FieldType= currentParam.input
                       if (_operation.isEditable){
                        fields[key]    = <FieldType key={currentParam.name} op={_operation.params} field={currentParam} style={{}} onChange={(e)=>{this.handleCellChange(this.props.materialId, _operationindex, key, e.target.value)}} />
                       } else {
                        fields[key]    = <span>{isNaN(_operation.params[currentParam]) ? "---": Number(_operation.params[currentParam])}</span>
                       }
                       
                       
                       
                       fields['_actions'] = <MaterialActions
                                                isEditable={_operation.isEditable}
                                                onEdit={(e)=>{this.handleRowEdit(this.props.materialId,_operationindex)}}
                                                onDelete={(e)=>{this.handleRowDelete(this.props.materialId,_operationindex)}}
                                                />
                       
                });
                
                
                data[_operation.type].push({name: (<strong>{_operation.name}</strong>), ...fields})
                
            });
            
           let result=[];
            Object.entries(tables).forEach((item)=>{
                let [type,columns] = item;
                let columnRatio=[...Array(columns.length-1).fill(1).fill(2,0,1),0]
                result.push(<Table key={uuid.v4()} columns={columns} data={data[type]} rowHeight={30} columnRatio={columnRatio}/>)
            })
            
            return(<div>{result}</div>);
        
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
        }
    }
    
})(MaterialOperations)

class Material extends React.Component {
    
    constructor(props){
        super(props);
        this.handleRowClick.bind(this)
        this.handleRowEdit.bind(this)
        this.handleRowDelete.bind(this)
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
    
    render(){
        
        let columns=[
            {id:"name",label:"Name"},
            {id:"thickness",label:"Thickness"},
            {id:"notes",label:"Notes"},
            {id:"_actions",label:""}
        ];
        
        let data=[];
        if (this.props.data.material.isEditable){
            data.push(
                {
                    name: this.props.data.material.name,
                    thickness: this.props.data.material.thickness,
                    notes: this.props.data.material.notes
                    
                }
            )
        } else {
            data.push(
                {
                    name: this.props.data.material.name,
                    thickness: this.props.data.material.thickness,
                    notes: this.props.data.material.notes,
                    collapseContent: (<MaterialOperations operations={this.props.data.operations} materialId={this.props.data.id} isOpened={this.props.data.isOpened}/>)
                }
            )
        }
        
        data[0]["_actions"] = <MaterialActions
                                                    isEditable={this.props.data.material.isEditable}
                                                    onEdit={(e)=>{this.handleRowEdit(e)}}
                                                    onDelete={(e)=>{this.handleRowDelete(e)}}
                                                    />
        
        return (<Table columns={columns} data={data} rowHeight={25} tableClass="flexTable" columnRatio={[2,1,5]} onRowClick={(e, rowIndex)=>{this.handleRowClick(e,rowIndex)}}/>);
    }
}



Material = connect(null, (dispatch)=>{
    return {
        handleCellChange: (materialId, attrs ) => {
            dispatch(setMaterialAttrs(materialId, attrs));
        },
        handleToggle: (materialId) => {
            dispatch(toggleMaterialView(materialId))
        },
        handleRowEdit: (materialId) => {
             dispatch(toggleMaterialEdit(materialId));
        },
        handleRowDelete: (materialId) => {
             if (confirm("Are you sure?")) dispatch(deleteMaterial(materialId));
        },
    }    
    
} )(Material);

class MaterialDatabaseEditor extends React.Component {
    
    constructor(props){
        super(props);
        this.state={selected: this.props.selectedProfile}
        this.handleProfileSelect.bind(this)
        this.handleMaterialChange.bind(this)
    }
    
    handleProfileSelect(e) {
        
    }
    
    handleMaterialChange(data){
        console.log(data)
    }
    
    render(){
     
        
        return (
            <FullSizeModal modal={{show:this.props.show, onHide:this.props.onHide, header:"Material Database"}}>
            <FormGroup>
            <ControlLabel>Profile Filter</ControlLabel>
              <FormControl componentClass="select"  ref="select" onChange={(e)=>{this.handleProfileSelect(e)}} value={this.state.selected}>
                      <option value="*">Any</option>
                      {
                        Object.entries(this.props.profiles).map((entry)=>{
                            let [key,item] = entry;
                            return (<option key={key} value={key}>{item.machineLabel}</option>)    
                        })
                      }
              </FormControl>
              </FormGroup>
              
              
              {this.props.materials.map((item)=>{
                   return (<Material key={uuid.v4()} data={item} onChange={(data)=>this.handleMaterialChange(data)}/>)
              })}
              
              
            </FullSizeModal>
         )
        
    }
    
}

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

const mapStateToProps = (state)=>{
    
    return {
        profiles: state.machineProfiles,
        materials: state.materialDatabase,
        selectedProfile: state.settings.__selectedProfile || "*"
    }
    
}

const mapDispatchToProps = (dispatch)=>{
    return {}
    
}


MaterialDatabaseEditor = connect(mapStateToProps, mapDispatchToProps)(MaterialDatabaseEditor)

