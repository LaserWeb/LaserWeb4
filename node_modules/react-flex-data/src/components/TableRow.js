import React, {Children, Component, PropTypes} from 'react';
import IndexWrapper from './IndexWrapper';
import prefixer from '../tools/prefixer';




const BASE_STYLE = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
};

class TableRow extends Component {

    static contextTypes = {
        altColor: PropTypes.string,
        childIndex: PropTypes.number
    }

    constructor() {
        super(...arguments);
        this.state = {
            altColor: false
        };

    }

    updateAltColor(props = this.props, context = this.context) {
        const {altColor, childIndex} = context;
        this.setState({
            altColor: altColor && childIndex%2 === 1 ? altColor : false
        });
    }

    componentWillMount() {
        this.updateAltColor();
    }

    componentWillReceiveProps(nextProps, nextState, nextContext) {
        this.updateAltColor(nextProps, nextContext);
    }

    render() {

        const {style, childIndex, rowInteraction, rowClass} = this.props;
        const {altColor} = this.state;

        
        const compStyle = {
            ...BASE_STYLE,
            ...style,
            backgroundColor: altColor,
            cursor: typeof rowInteraction === 'function' ? 'pointer' : :undefined
        };

        return ( 
            <div className={rowClass} style={prefixer.prefix(compStyle)} onClick={this.onInteraction(childIndex)}>
                {Children.map(this.props.children, (Column, i) => {
                    return <IndexWrapper childIndex={i}>
                        {Column}
                    </IndexWrapper>;
                })}

            </div>
        );  
       
    }

    /*
    * Handlers
    * */

    onInteraction = (rowIndex) => {
        const {rowInteraction} = this.props;
        return (e) => {
            if(typeof rowInteraction === 'function') rowInteraction(e, rowIndex);
        };
    }

}

TableRow.propTypes = {
    rowInteraction: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool
    ]),
    rowClass: PropTypes.string,
    style: PropTypes.object
};

TableRow.defaultProps = {
    rowInteraction: false,
    style: {},
};


export default TableRow;
