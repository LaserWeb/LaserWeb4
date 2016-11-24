import uuid from 'node-uuid';

import React from 'react'
import ReactDOM from 'react-dom'
import {connect, dispatch} from 'react-redux'

import * as operation from './operation'

import {Modal, Button, FormControl, ControlLabel, FormGroup, PanelGroup, Panel, Collapse} from 'react-bootstrap'
import * as FlexData from 'react-flex-data';

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
  
  constructor(props){
    super(props)
    this.state={isOpened:false}
    this.handleInteraction.bind(this);
  }
  
  handleInteraction(e,rowIndex){
    this.setState({isOpened:!this.state.isOpened})
    if (this.props.onTap) 
        this.props.onTap(e,rowIndex)
  }
  
  handleSelect(e,rowIndex){
    if (this.props.onSelect) 
        this.props.onSelect(e,rowIndex)
  }
  
  render(){
    let childIndex=this.props.childIndex;
    
    let props=Object.assign({},this.props)
        props.rowClass += (this.props.collapseContent)? " collapsible" : "";
        props.rowClass += (this.state.isOpened)? " opened" : "";
    
    
    return (
      <div onDoubleClick={(e)=>this.handleInteraction(e,childIndex)} onClick={(e)=>this.handleSelect(e,childIndex)} style={this.props.style}>
      <FlexData.TableRow {...props} >{this.props.children}</FlexData.TableRow>
      <Collapse in={this.state.isOpened}><div className="nestedTableWrapper">{this.props.collapseContent}</div></Collapse>
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
            <FlexData.Table {...this.props } altColor="none">
                {(this.props.header)? <caption>{this.props.header}</caption> : undefined}
                
                <FlexData.TableHeader rowClass="flexTHead">
                   {this.props.columns.map((column) => <FlexData.TableHeaderColumn key={column.id}>{column.label}</FlexData.TableHeaderColumn>)}
                </FlexData.TableHeader>
                <FlexData.TableBody bodyClass="flexTbody">
                    {this.props.data.map((row, i) => {
                        
                        let style=(!(i%2)) ? {backgroundColor:this.props.altColor} : undefined
                        if (this.state.selectedIndex===i) {
                            style = {backgroundColor:this.props.selectColor}
                        }
                        
                        return (
                            <TableRow key={i} childIndex={i} collapseContent={this.props.data[i].collapseContent} style={style} onSelect={handleSelect} rowClass="tableRow">
                                {this.props.columns.map((column,j) => <FlexData.TableRowColumn key={column.id}>{this.props.data[i][column.id]}</FlexData.TableRowColumn>)}
                            </TableRow>
                        );
                    })}
                </FlexData.TableBody>
            </FlexData.Table>
        );
    }
    
}


function MaterialOperations({operations,...rest}) {

 
    let data={};
    let tables={};
    operations.forEach((_operation)=>{
        /*Takes the type of operation from operation::types*/
        let currentOperation=operation.types[_operation.type]
        
        /*Extracts the column names from operation::fields*/
        let columns= [{id: "name", label: _operation.type}];
        
        currentOperation.fields.forEach((key)=>{
            let currentParam = operation.fields[key];
            columns.push({id: key, label: currentParam.label})
        })
        
        /*Assigns a table for each kind of operation available for that material*/
        tables[_operation.type]=columns;
        
        if (typeof  data[_operation.type] =='undefined')
             data[_operation.type]=[];
        
        
        let fields={}
        // fields=_operation.params
        currentOperation.fields.forEach((key)=>{
               let currentParam = operation.fields[key];
               let FieldType= currentParam.input
               //op, field, onChange, onFocus
               fields[key]    = <label><FieldType key={currentParam.name} op={_operation.params} field={key} style={{}} />{currentParam.units}</label>
        });
        
        
        data[_operation.type].push({name: (<strong>{_operation.name}</strong>), ...fields})
        
    });
    
   let result=[];
    Object.entries(tables).forEach((item)=>{
        let [type,columns] = item;
        result.push(<div key={uuid.v4()}><Table  columns={columns} data={data[type]} rowHeight={30} columnRatio={[2].fill(1,1)}/></div>)
        
    })
    
    return(<div>{result}</div>);
   
   
   
}

class Material extends React.Component {
    
    /*<Panel collapsible key={item.id} header={<div><strong>{item.material.name}, {item.material.thickness}</strong> <small>{item.material.notes}</small></div>}><MaterialOperations operations={item.operations}/></Panel>*/
    
    
    render(){
        
        let columns=[
            {id:"name",label:"Name"},
            {id:"thickness",label:"Thickness"},
            {id:"notes",label:"Notes"},
        ];
        
        let data=[
            {
                name: this.props.data.material.name,
                thickness: this.props.data.material.thickness,
                notes: this.props.data.material.notes,
                collapseContent: (<MaterialOperations operations={this.props.data.operations}/>)
            }
        ]
        
        
        return (<Table columns={columns} data={data} rowHeight={25} tableClass="flexTable" columnRatio={[2,1,5]} />);
    }
}

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

