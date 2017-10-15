'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('es6-promise');

require('isomorphic-fetch');

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _QuoteSet = require('./QuoteSet');

var _QuoteSet2 = _interopRequireDefault(_QuoteSet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Skyscanner = function () {
    function Skyscanner(api_key) {
        _classCallCheck(this, Skyscanner);

        this.api_key = api_key;
        this.base_url = 'http://partners.api.skyscanner.net/apiservices/';

        this.setLocale('en-GB');
        this.setMarket('GB');
        this.setCurrency('GBP');

        this.setVersion('1.0');
    }

    _createClass(Skyscanner, [{
        key: 'shortApiKey',
        value: function shortApiKey() {
            return this.api_key.substr(0, 16);
        }
    }, {
        key: 'setLocale',
        value: function setLocale(locale) {
            this.locale = locale;
        }
    }, {
        key: 'setVersion',
        value: function setVersion(version) {
            this.version = 'v' + version;
        }
    }, {
        key: 'setMarket',
        value: function setMarket(market) {
            this.market = market;
        }
    }, {
        key: 'setCurrency',
        value: function setCurrency(currency) {
            this.currency = currency;
        }
    }, {
        key: 'endpoint',
        value: function endpoint(parts, params) {
            return '' + this.base_url + parts.join('/') + '?' + _queryString2.default.stringify(params);
        }
    }, {
        key: 'get',
        value: function get() {
            var params = { apiKey: this.api_key };

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var last = args[args.length - 1];

            if ((typeof last === 'undefined' ? 'undefined' : _typeof(last)) == 'object') {
                args.pop(-1);
                params = Object.assign(params, last);
            }

            var endpoint = this.endpoint(args, params);

            return fetch(endpoint).then(function (res) {
                return res.text();
            }).then(function (res) {
                return JSON.parse(res);
            });
        }
    }, {
        key: 'locales',
        value: function locales() {
            return this.get('reference', this.version, 'locales').then(function (r) {
                return r.Locales;
            });
        }
    }, {
        key: 'markets',
        value: function markets() {
            var locale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locale;

            return this.get('reference', this.version, 'countries', locale).then(function (r) {
                return r.Countries;
            });
        }
    }, {
        key: 'currencies',
        value: function currencies() {
            return this.get('reference', this.version, 'currencies').then(function (r) {
                return r.Currencies;
            });
        }
    }, {
        key: 'autosuggest',
        value: function autosuggest(query) {
            return this.get('autosuggest', this.version, this.market, this.currency, this.locale, { query: query }).then(function (r) {
                return r.Places;
            });
        }
    }, {
        key: 'autosuggestLocation',
        value: function autosuggestLocation(id) {
            return this.get('autosuggest', this.version, this.market, this.currency, this.locale, { id: id }).then(function (r) {
                return r.Places;
            });
        }
    }, {
        key: 'browsequotes',
        value: function browsequotes(originPlace) {
            var destinationPlace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'everywhere';

            var _this = this;

            var outboundPartialDate = arguments[2];
            var inboundPartialDate = arguments[3];

            return this.get('browsequotes', this.version, this.market, this.currency, this.locale, originPlace, destinationPlace, outboundPartialDate, inboundPartialDate).then(function (r) {
                var referral_url = _this.referral(originPlace, destinationPlace, outboundPartialDate, inboundPartialDate);
                return new _QuoteSet2.default(r.Quotes, r.Places, r.Carriers, r.Currencies, referral_url);
            });
        }
    }, {
        key: 'referral',
        value: function referral(originPlace, destinationPlace, outboundPartialDate, inboundPartialDate) {
            outboundPartialDate = outboundPartialDate.substr(0, '2016-01-01'.length);
            inboundPartialDate = inboundPartialDate.substr(0, '2016-01-01'.length);

            return this.endpoint(['referral', this.version, this.market, this.currency, this.locale, originPlace, destinationPlace, outboundPartialDate, inboundPartialDate], { apiKey: this.shortApiKey() });
        }
    }]);

    return Skyscanner;
}();

exports.default = Skyscanner;