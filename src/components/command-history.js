

import React from 'react';
import ReactDOM from 'react-dom'

import Icon from './font-awesome';
import Splitter from './splitter'
import { Button, Label } from 'react-bootstrap'
import { dispatch, connect } from 'react-redux';

import keydown, { Keys } from 'react-keydown';

const keystrokes = ["shift+up", "shift+down", "shift+enter"]

// level STD, INFO, WARN, DANGER
const COMMANDLOG_ICON = ['terminal', 'info-circle', 'exclamation-triangle', 'exclamation-circle'];
const COMMANDLOG_CLASS = ['default', 'info', 'warning', 'danger'];

class CommandLog extends React.Component {
    constructor(props) {
        super(props);
        this.state = { lines: this.props.lines };
    }
    render() {
        return <div>{this.state.lines.map((line, i) => { return React.cloneElement(line, { key: i }) })}</div>;
    }
    log(message, level = 0, icon = undefined) {
        if (typeof icon == 'undefined') icon = level;
        level = isNaN(level) ? level : COMMANDLOG_CLASS[level]
        icon = isNaN(icon) ? icon : COMMANDLOG_ICON[icon]

        let line = <code><Label bsStyle={level}><Icon name={icon} /></Label> {message}</code>
        
        this.setState({ lines: [...this.state.lines, line] })
    }

    componentDidUpdate()
    {
        let parent = ReactDOM.findDOMNode(this).parentNode;
            parent.scrollTop = parent.scrollHeight
    }
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

            if (window.commandHistory) {
                window.commandHistory.log(value);
            }

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
        if (!window.commandHistory) {
            window.commandHistory = ReactDOM.render(<CommandLog lines={this.state.lines} />, ReactDOM.findDOMNode(this.refs['code']))
        }
    }
    componentWillUnmount() {
        if (window.commandHistory)
            ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this.refs['code']))
    }

    static log(message, level, icon) {
        if (window.commandHistory)
            window.commandHistory.log(message, level, icon);
    }

    render() {
        return (
            <div className="commandHistory">
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