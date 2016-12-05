import React from 'react';
import ReactDOM from 'react-dom';

export class Macros extends React.Component {
    
    render(){
        return (
            <div className="macros">
            <select size="10">
                <option value="F1">F1 (STOP)</option>
                <option value="F2">F2 (CONTINUE)</option>
            </select>
            <input type="text" placeholder="keybinding"/>
            <input type="text" placeholder="gcode"/>
            <button>Append</button>
            <button>Delete Selected</button>
            </div>
            
        )
    }
}