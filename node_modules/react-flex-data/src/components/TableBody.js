import React, {Children, Component, PropTypes} from 'react';
import IndexWrapper from './IndexWrapper'
import prefixer from '../tools/prefixer';

const BASE_STYLE = {
    display: 'flex',
    flexDirection: 'column'
};




class TableBody extends Component {

    render() {

        const {style, bodyClass} = this.props;

        const compStyle = {
            ...BASE_STYLE,
            ...style
        };

        return ( 
            <div className={bodyClass} style={prefixer.prefix(compStyle)}>
                {Children.map(this.props.children, (Row, i) => {
                    return <IndexWrapper childIndex={i}>
                        {Row}
                    </IndexWrapper>;
                })}
            </div>
        );  
       
    }

}

TableBody.propTypes = {
    style: PropTypes.object,
    bodyClass: PropTypes.string
};

TableBody.defaultProps = {
    style: {}
};

export default TableBody;

