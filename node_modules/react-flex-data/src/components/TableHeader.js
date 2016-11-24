import React, {Component, PropTypes} from 'react';
import TableRow from './TableRow';


const BASE_STYLE = {
    color: '#9e9e9e'
};

class TableHeader extends Component {

    render() {
        return <TableRow {...this.props} style={{...BASE_STYLE}} altColor={false}>
            {this.props.children}
        </TableRow>;
    }
}

TableHeader.propTypes = {
    style: PropTypes.object
};

TableHeader.defaultProps = {
    style: {}
};

export default TableHeader;
