import React, {Component, PropTypes} from 'react';
import prefixer from '../tools/prefixer';


const BASE_STYLE = {
    textAlign: 'left',
    flexGrow: 1,
    flex: 1,
    minWidth: 50,
    alignItems: 'center',
    display: 'flex',
    paddingLeft: 5
};

const CELL_BASE_STYLE = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow:'ellipsis',
    padding: '0 5px',
};

class TableRowColumn extends Component {

    static contextTypes = {
        columnRatio: PropTypes.array,
        rowHeight: PropTypes.number,
        childIndex: PropTypes.number
    }

    render() {

        const {alignCellContent, style, cellStyle, columnInteraction, columnClass } = this.props;
        const {rowHeight, columnRatio, childIndex} = this.context;

     
        const compStyle = {
            ...BASE_STYLE,
            ...style,
            height: rowHeight,
            justifyContent: alignCellContent,
            flex: columnRatio[childIndex] ? columnRatio[childIndex] : 1,
            cursor: typeof columnInteraction === 'function' ? 'pointer' :undefined

        };

        const compCellStyle = {
            ...CELL_BASE_STYLE,
            ...cellStyle
        };


        return ( 
            <div className={columnClass} style={prefixer.prefix(compStyle)} onClick={this.onInteraction(childIndex)}>
                  <div style={prefixer.prefix(compCellStyle)}>{this.props.children}</div>
            </div>
        );  
       
    }

    /*
     * Handlers
     * */

    onInteraction = (cellIndex) => {
        const {columnInteraction} = this.props;
        return (e) => {
            if(typeof columnInteraction === 'function') columnInteraction(e, cellIndex);
        };
    }

}

TableRowColumn.propTypes = {
    columnInteraction: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool
    ]),
    style: PropTypes.object,
    cellStyle: PropTypes.object,
    columnClass: PropTypes.string,
};

TableRowColumn.defaultProps = {
    alignCellContent: 'flex-start',
    style: {},
    cellStyle: {},
};



export default TableRowColumn;
