import React from 'react';
import ReactDOM from 'react-dom'

import Icon from './font-awesome';
import Splitter from './splitter'
import { Button, Label } from 'react-bootstrap'
import { dispatch, connect } from 'react-redux';

import { isObject } from '../lib/helpers';

import stringify from 'json-stringify-safe'

// level STD, INFO, WARN, DANGER, SUCCESS
const CommandHistory_ICON = ['terminal', 'info-circle', 'exclamation-triangle', 'exclamation-circle', 'check-circle'];
const CommandHistory_CLASS = ['default', 'info', 'warning', 'danger', 'success'];

const createCommandLogLine = (message, level = 0, icon = undefined) => {
    if (icon === undefined) icon = level;
    level = isNaN(level) ? level : CommandHistory_CLASS[level]
    icon = isNaN(icon) ? icon : CommandHistory_ICON[icon]
    let line = document.createElement('code')
        line.className = level;
        line.innerHTML = `<i class="fa fa-${icon}"></i> ${message}`
    return line;
}

export default class CommandHistory extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentLine: '',
            lines: [],
            cursor: 0
        }

        this.handleChange.bind(this);
        this.handleKey.bind(this)
    }
    
    handleKey(e) {
        if (e.which == 38) {
            this.handleCommandUp(e)
        } else if (e.which == 40) {
            this.handleCommandDown(e)
        } else if (e.which == 13) {
            this.handleCommandExec(e)
        }
    }

    handleChange(e) {
        this.setState({ currentLine: e.target.value });
    }

    handleCommandUp(e) {
        e.preventDefault();
        let cursor = this.state.cursor - 1;
        if (cursor < 0) cursor = 0;
        this.setState({ cursor, currentLine: this.state.lines[cursor] });

        if (typeof this.props.onCommandUp !== "undefined")
            this.props.onCommandUp();

    }

    handleCommandDown(e) {
        e.preventDefault();
        let cursor = this.state.cursor + 1;

        if (cursor > this.state.lines.length - 1) {
            this.setState({ cursor: this.state.lines.length, currentLine: '' })
        } else {
            this.setState({ cursor, currentLine: this.state.lines[cursor] })
        }


        if (typeof this.props.onCommandDown !== "undefined")
            this.props.onCommandDown();
    }

    handleCommandDelete(e) {
        this.setState({ currentLine: '' });
    }

    handleCommandExec(e) {
        e.preventDefault();
        let value = e.target.value;
        if (value.length) {
            let lines = [...this.state.lines, value]
            this.scrollToBottom = true
            this.setState({ currentLine: '', lines, cursor: lines.length });

            if (window.commandLog)
                CommandHistory.write(value)

        }
        if (typeof this.props.onCommandExec !== "undefined")
            this.props.onCommandExec(value);
    }

    componentDidUpdate() {
        if (this.scrollToBottom) {
            this.scrollToBottom = false;
            let node = ReactDOM.findDOMNode(this.refs.code);
            node.scrollTop = node.scrollHeight
        }
    }

    componentDidMount() {
        if (!window.commandLog)
            window.commandLog = document.createElement('div')

        ReactDOM.findDOMNode(this.refs['code']).appendChild(window.commandLog)
    }
    componentWillUnmount() {
        if (window.commandLog)
            ReactDOM.findDOMNode(this.refs['code']).removeChild(window.commandLog)

    }

    static write(message, level, icon) {
        if (!window.commandLog)
            window.commandLog = document.createElement('div')
        
        window.commandLog.appendChild(createCommandLogLine(message, level, icon));

        if (window.commandLog.parentNode){
            let node = window.commandLog.parentNode;
                node.scrollTop = node.scrollHeight
        }

    }

    static log(...args) {
        CommandHistory.write(args.map(arg => isObject(arg)? stringify(arg) : String(arg)).join(' '))
    }

    static warn(...args) {
        CommandHistory.write(args.map(arg => isObject(arg)? stringify(arg) : String(arg)).join(' '), 2)
    }

    static error(...args) {
        CommandHistory.write(args.map(arg => isObject(arg)? stringify(arg) : String(arg)).join(' '), 3)
    }

    static dir(message, items, level) {
        CommandHistory.write(`<details><summary>${message}</summary><p>${stringify(items)}</p></details>`, level)
    }

    render() {
        return (
            <div className="commandHistory" style={this.props.style}>
                <div ref="code" className="code"></div>
                <div className="form">
                    <Icon name="terminal" fw={true} />
                    <input ref="input" type="text" placeholder="Use UP and DOWN on keyboard to cycle by commands, ENTER to execute." onChange={(e) => { this.handleChange(e) } } onKeyDown={e=>(this.handleKey(e))} value={this.state.currentLine} />
                    <div className="toolbar">
                        <Button bsSize="xsmall" onClick={(e) => { this.handleCommandUp() } }><Icon name="arrow-up" fw={true} /></Button>
                        <Button bsSize="xsmall" onClick={(e) => { this.handleCommandDown() } }><Icon name="arrow-down" fw={true} /></Button>
                        <Button bsSize="xsmall" onClick={(e) => { this.handleCommandDelete() } } bsStyle="danger"><Icon name="times" fw={true} /></Button>
                    </div>
                </div>
            </div>
        );
    }

}

const mapStateToProps = (state) => {
    return {}
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

CommandHistory = connect(mapStateToProps, mapDispatchToProps)(CommandHistory)

CommandHistory.STD = 0;
CommandHistory.INFO = 1;
CommandHistory.WARN = 2;
CommandHistory.DANGER = 3;
CommandHistory.SUCCESS = 4;
