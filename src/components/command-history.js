

import React from 'react';
import ReactDOM from 'react-dom'

import Icon from './font-awesome';
import Splitter from './splitter'
import { Button, Label } from 'react-bootstrap'
import { dispatch, connect } from 'react-redux';

import keydown, { Keys } from 'react-keydown';

const keystrokes = ["shift+up", "shift+down", "shift+enter"]

// level STD, INFO, WARN, DANGER
const CommandHistory_ICON = ['terminal', 'info-circle', 'exclamation-triangle', 'exclamation-circle'];
const CommandHistory_CLASS = ['default', 'info', 'warning', 'danger'];

const createCommandLogLine = (message, level = 0, icon = undefined) => {
    if (typeof icon == 'undefined') icon = level;
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
    }


    @keydown(keystrokes)
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
        let cursor = this.state.cursor - 1;
        if (cursor < 0) cursor = 0;
        this.setState({ cursor, currentLine: this.state.lines[cursor] });

        if (typeof this.props.onCommandUp !== "undefined")
            this.props.onCommandUp();

    }

    handleCommandDown(e) {
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
        let value = e.target.value;
        if (value.length) {
            let lines = [...this.state.lines, value]
            this.scrollToBottom = true
            this.setState({ currentLine: '', lines, cursor: lines.length });

            if (window.commandLog)
                CommandHistory.log(value)

        }
        if (typeof this.props.onCommandExec !== "undefined")
            this.props.onCommandExec();
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

    static log(message, level, icon) {
        if (!window.commandLog)
            window.commandLog = document.createElement('div')

        window.commandLog.appendChild(createCommandLogLine(message, level, icon));

        if (window.commandLog.parentNode){
            let node = window.commandLog.parentNode;
                node.scrollTop = node.scrollHeight
        }

    }

    render() {
        return (
            <div className="commandHistory" style={this.props.style}>
                <div ref="code" className="code"></div>
                <div className="form">
                    <Icon name="terminal" fw={true} />
                    <input ref="input" type="text" placeholder="Use SHIFT+UP and DOWN on keyboard to cycle by commands, SHIFT+ENTER to execute." onChange={(e) => { this.handleChange(e) } } onKeyDown={this.handleKey} value={this.state.currentLine} />
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