import uuid from 'node-uuid';

import React from 'react'
import ReactDOM from 'react-dom'
import {Modal, Button, FormControl, ControlLabel, FormGroup, PanelGroup, Panel} from 'react-bootstrap'
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table'

import {connect, dispatch} from 'react-redux'
import * as operation from './operation'


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

function MaterialOperations({operations,...rest}) {
        
        let data={};
        let tables={};
        operations.forEach((_operation)=>{
            /*Takes the type of operation from operation::types*/
            let currentOperation=operation.types[_operation.type]
            
            /*Extracts the column names from operation::fields*/
            let columns= [
                 <TableHeaderColumn isKey={true} key={uuid.v4()} dataField="operation_name" >Name</TableHeaderColumn>,
                 <TableHeaderColumn key={uuid.v4()} dataField="operation_profile" >Profile</TableHeaderColumn>,
                 <TableHeaderColumn key={uuid.v4()} dataField="operation_notes" >Notes</TableHeaderColumn>      
            ];
            
            currentOperation.fields.forEach((key)=>{
                let currentParam = operation.fields[key];
                columns.push(<TableHeaderColumn dataField={key} key={uuid.v4()} >{currentParam.label}</TableHeaderColumn>)
                
            })
            
            /*Assigns a table for each kind of operation available for that material*/
            tables[_operation.type]=columns;
            
            if (typeof  data[_operation.type] =='undefined')
                 data[_operation.type]=[];
            
            data[_operation.type].push({ operation_name: _operation.name, operation_profile: _operation.profile, operation_notes: _operation.notes, ..._operation.params})
            
        });
        
        let result=[];
        Object.entries(tables).forEach((item)=>{
            let [type,columns] = item;
            result.push(<div key={uuid.v4()}><h5>{type}</h5><BootstrapTable condensed={false}  data={data[type]} cellEdit={{mode: 'dbclick'}} selectRow={{ mode: 'radio', clickToSelect: true, bgColor: '#f6f6f6'}}>{columns}</BootstrapTable></div>)
        })
        
    return(<div>{result}</div>);
}

class MaterialDatabaseModal extends React.Component {
    
    constructor(props){
        super(props);
        this.state={selected: this.props.selectedProfile}
        this.handleProfileSelect.bind(this)
    }
    
    handleProfileSelect(e) {
        
    }
    
    render(){
        
    
        
        let profileOptions=[];
        Object.entries(this.props.profiles).forEach((entry)=>{
            let [key,item] = entry;
            profileOptions.push(<option key={key} value={key}>{item.machineLabel}</option>)    
        });
        
        let materials=[];
        this.props.materials.forEach((item)=>{
                    materials.push(<Panel collapsible key={item.id} header={<div><strong>{item.material.name}, {item.material.thickness}</strong> <small>{item.material.notes}</small></div>}><MaterialOperations operations={item.operations}/></Panel>)
        })
        
        return (
            <FullSizeModal modal={{show:this.props.show, onHide:this.props.onHide, header:"Material Database"}}>
            <FormGroup>
            <ControlLabel>Profile Filter</ControlLabel>
              <FormControl componentClass="select"  ref="select" onChange={(e)=>{this.handleProfileSelect(e)}} value={this.state.selected}>
                      <option value="*">Any</option>
                      {profileOptions}
                      
              </FormControl>
              </FormGroup>
              
              <PanelGroup>{materials}</PanelGroup>
              
            </FullSizeModal>
         )
        
    }
    
}

export class MaterialDatabaseEditor extends React.Component {
    
    constructor(props) {
        super(props);
        this.state={showModal:false}
    }
    
    render() {
        
        let closeModal = () => this.setState({ showModal: false });
        
        return (
            <div>
            <Button bsStyle="primary" block onClick={()=>this.setState({ showModal: true })}>Launch Material Database</Button>
            <MaterialDatabaseModal show={this.state.showModal} onHide={closeModal}/>
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


MaterialDatabaseModal = connect(mapStateToProps, mapDispatchToProps)(MaterialDatabaseModal)

