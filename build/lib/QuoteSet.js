'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Leg = require('./Leg');

var _Leg2 = _interopRequireDefault(_Leg);

var _Quote = require('./Quote');

var _Quote2 = _interopRequireDefault(_Quote);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QuoteSet = function () {
    function QuoteSet(Quotes, Places, Carriers, Currencies, referral_url) {
        _classCallCheck(this, QuoteSet);

        this.Quotes = Quotes;
        this.Places = Places;
        this.Carriers = Carriers;
        this.Currencies = Currencies;

        this.referral_url = referral_url;
    }

    _createClass(QuoteSet, [{
        key: 'length',
        value: function length() {
            return this.Quotes.length;
        }
    }, {
        key: 'row',
        value: function row(index) {
            var quote = this.Quotes[index];

            var outbound = this.createLeg(quote.OutboundLeg);
            var inbound = this.createLeg(quote.InboundLeg);

            return new _Quote2.default(quote.QuoteId, this.Currencies[0], quote.MinPrice, quote.Direct, outbound, inbound);
        }
    }, {
        key: 'map',
        value: function map(fn) {
            var _this = this;

            return Object.keys(this.Quotes).map(function (index) {
                return fn(_this.row(index), index);
            });
        }
    }, {
        key: 'createLeg',
        value: function createLeg(input) {
            if (input) {
                var origin = this.findPlace(input.OriginId);
                var destination = this.findPlace(input.DestinationId);
                var carriers = this.findCarriers(input.CarrierIds);

                return new _Leg2.default(input.DepartureDate, origin, destination, carriers);
            }
        }
    }, {
        key: 'findPlace',
        value: function findPlace(id) {
            var output = void 0;

            this.Places.forEach(function (place) {
                if (place.PlaceId == id) {
                    output = place;
                }
            });

            return output;
        }
    }, {
        key: 'findCarriers',
        value: function findCarriers() {
            var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            var output = [];

            this.Carriers.forEach(function (carrier) {
                if (input.indexOf(carrier.CarrierId) > -1) {
                    output.push(carrier);
                }
            });

            return output;
        }
    }, {
        key: 'referralUrl',
        value: function referralUrl() {
            return this.referral_url;
        }
    }]);

    return QuoteSet;
}();

exports.default = QuoteSet;