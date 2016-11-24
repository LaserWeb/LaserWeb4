'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _IndexWrapper = require('./IndexWrapper');

var _IndexWrapper2 = _interopRequireDefault(_IndexWrapper);

var _prefixer = require('../tools/prefixer');

var _prefixer2 = _interopRequireDefault(_prefixer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BASE_STYLE = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap'
};

var TableRow = function (_Component) {
    _inherits(TableRow, _Component);

    function TableRow() {
        _classCallCheck(this, TableRow);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TableRow).apply(this, arguments));

        _this.onInteraction = function (rowIndex) {
            var rowInteraction = _this.props.rowInteraction;

            return function (e) {
                if (typeof rowInteraction === 'function') rowInteraction(e, rowIndex);
            };
        };

        _this.state = {
            altColor: false
        };

        return _this;
    }

    _createClass(TableRow, [{
        key: 'updateAltColor',
        value: function updateAltColor() {
            var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];
            var context = arguments.length <= 1 || arguments[1] === undefined ? this.context : arguments[1];
            var altColor = context.altColor;
            var childIndex = context.childIndex;

            this.setState({
                altColor: altColor && childIndex % 2 === 1 ? altColor : false
            });
        }
    }, {
        key: 'componentWillMount',
        value: function componentWillMount() {
            this.updateAltColor();
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(nextProps, nextState, nextContext) {
            this.updateAltColor(nextProps, nextContext);
        }
    }, {
        key: 'render',
        value: function render() {
            var _props = this.props;
            var style = _props.style;
            var childIndex = _props.childIndex;
            var rowInteraction = _props.rowInteraction;
            var rowClass = _props.rowClass;
            var altColor = this.state.altColor;


            var compStyle = _extends({}, BASE_STYLE, style, {
                backgroundColor: altColor,
                cursor: typeof rowInteraction === 'function' ? 'pointer' : undefined
            });

            return _react2.default.createElement(
                'div',
                { className: rowClass, style: _prefixer2.default.prefix(compStyle), onClick: this.onInteraction(childIndex) },
                _react.Children.map(this.props.children, function (Column, i) {
                    return _react2.default.createElement(
                        _IndexWrapper2.default,
                        { childIndex: i },
                        Column
                    );
                })
            );
        }

        /*
        * Handlers
        * */

    }]);

    return TableRow;
}(_react.Component);

TableRow.contextTypes = {
    altColor: _react.PropTypes.string,
    childIndex: _react.PropTypes.number
};


TableRow.propTypes = {
    rowInteraction: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.bool]),
    rowClass: _react.PropTypes.string,
    style: _react.PropTypes.object
};

TableRow.defaultProps = {
    rowInteraction: false,
    style: {}
};

exports.default = TableRow;