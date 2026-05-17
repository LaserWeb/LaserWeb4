import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom';
import keyboardJS from 'keyboardjs'

export const keyboardLogger = keyboardJS;

export const bindKeys=(keys, context='global')=>{
    keyboardLogger.withContext(context, () => {
        keys.forEach((entry)=>{
            let [keybinding,method] = entry;
            keyboardLogger.bind(keybinding.filter((i)=>(i!==undefined)),method)
        })
    })
}

export const unbindKeys=(keys)=>{
    keys.forEach((entry)=>{
        let [keybinding,method] = entry;
       keyboardLogger.unbind(keybinding.filter((i)=>(i!==undefined)),method)
    })
}

export const withKeyboardContext=(WrappedComponent, keyboardContext) =>{
    return class extends React.Component {
        constructor(props){
            super(props);
            this.__keyboardContext = 'global'
            this.handleMouseEnter = this.handleMouseEnter.bind(this);
            this.handleMouseLeave = this.handleMouseLeave.bind(this);
        }

        handleMouseEnter(e){
            if (keyboardLogger) {
                this.__keyboardContext=keyboardLogger.getContext();
                keyboardLogger.setContext(keyboardContext)
                console.log(keyboardContext)
            }
        }

        handleMouseLeave(e){
            if (keyboardLogger) {
                console.log(this.__keyboardContext )
               keyboardLogger.setContext(this.__keyboardContext || 'global')
                this.__keyboardContext = 'global';
                
            }
        }

        render() {
            return <WrappedComponent onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} {...this.props} />
        }
    }
}