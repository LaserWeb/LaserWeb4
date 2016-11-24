'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _prefixer = require('../tools/prefixer');

var _prefixer2 = _interopRequireDefault(_prefixer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BASE_STYLE = {
    textAlign: 'left',
    flexGrow: 1,
    flex: 1,
    minWidth: 50,
    alignItems: 'center',
    display: 'flex',
    paddingLeft: 5
};

var CELL_BASE_STYLE = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '0 5px'
};

var TableRowColumn = function (_Component) {
    _inherits(TableRowColumn, _Component);

    function TableRowColumn() {
        var _Object$getPrototypeO;

        var _temp, _this, _ret;

        _classCallCheck(this, TableRowColumn);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(TableRowColumn)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this), _this.onInteraction = function (cellIndex) {
            var columnInteraction = _this.props.columnInteraction;

            return function (e) {
                if (typeof columnInteraction === 'function') columnInteraction(e, cellIndex);
            };
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(TableRowColumn, [{
        key: 'render',
        value: function render() {
            var _props = this.props;
            var alignCellContent = _props.alignCellContent;
            var style = _props.style;
            var cellStyle = _props.cellStyle;
            var columnInteraction = _props.columnInteraction;
            var columnClass = _props.columnClass;
            var _context = this.context;
            var rowHeight = _context.rowHeight;
            var columnRatio = _context.columnRatio;
            var childIndex = _context.childIndex;


            var compStyle = _extends({}, BASE_STYLE, style, {
                height: rowHeight,
                justifyContent: alignCellContent,
                flex: columnRatio[childIndex] ? columnRatio[childIndex] : 1,
                cursor: typeof columnInteraction === 'function' ? 'pointer' : undefined

            });

            var compCellStyle = _extends({}, CELL_BASE_STYLE, cellStyle);

            return _react2.default.createElement(
                'div',
                { className: columnClass, style: _prefixer2.default.prefix(compStyle), onClick: this.onInteraction(childIndex) },
                _react2.default.createElement(
                    'div',
                    { style: _prefixer2.default.prefix(compCellStyle) },
                    this.props.children
                )
            );
        }

        /*
         * Handlers
         * */

    }]);

    return TableRowColumn;
}(_react.Component);

TableRowColumn.contextTypes = {
    columnRatio: _react.PropTypes.array,
    rowHeight: _react.PropTypes.number,
    childIndex: _react.PropTypes.number
};


TableRowColumn.propTypes = {
    columnInteraction: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.bool]),
    style: _react.PropTypes.object,
    cellStyle: _react.PropTypes.object,
    columnClass: _react.PropTypes.string
};

TableRowColumn.defaultProps = {
    alignCellContent: 'flex-start',
    style: {},
    cellStyle: {}
};

exports.default = TableRowColumn;