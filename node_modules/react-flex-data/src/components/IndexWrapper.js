import React, { isValidElement, Component, PropTypes} from 'react';



class IndexWrapper extends Component {
    static childContextTypes = {
        childIndex: PropTypes.number
    }
    getChildContext() {
        const {childIndex} = this.props;
        return {
            childIndex
        };
    }
    render() {
        const content = isValidElement(this.props.children) ? this.props.children : <span>{this.props.children}</span>;
        return content;
    }
}

export default IndexWrapper;
