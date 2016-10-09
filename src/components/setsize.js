import React from 'react'
import ReactDOM from 'react-dom';

export default class SetSize extends React.Component {
    constructor() {
        super();
        this.clientWidth = 1;
        this.clientHeight = 1;
    }

    componentDidMount() {
        this.mounted = true;
        let f = () => {
            if (!this.mounted)
                return;
            let node = ReactDOM.findDOMNode(this);
            if (this.clientWidth !== node.clientWidth || this.clientHeight !== node.clientHeight) {
                this.clientWidth = node.clientWidth;
                this.clientHeight = node.clientHeight;
                this.setState({});
            }
            requestAnimationFrame(f);
        };
        f();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        console.log(this.clientWidth, this.clientHeight);
        return (
            <div {...{...this.props }}>
                {React.cloneElement(this.props.children, { width: this.clientWidth, height: this.clientHeight })}
            </div>
        );
    }
}
