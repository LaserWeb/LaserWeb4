import React, {Component, PropTypes} from 'react';
import TableRowColumn from './TableRowColumn';


const BASE_STYLE = {};


class TableHeaderColumn extends Component {
    render() {
        return <TableRowColumn  {...this.props} style={{...BASE_STYLE}}>
            {this.props.children}
        </TableRowColumn>;
    }
}

TableHeaderColumn.propTypes = {
    style: PropTypes.object
};

TableHeaderColumn.defaultProps = {
    style: {}
};

export default TableHeaderColumn;
