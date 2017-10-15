"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Quote = function Quote(QuoteId, Currency, MinPrice, Direct, OutboundLeg, InboundLeg) {
    _classCallCheck(this, Quote);

    this.QuoteId = QuoteId;
    this.Currency = Currency;
    this.MinPrice = MinPrice;
    this.Direct = Direct;
    this.OutboundLeg = OutboundLeg;
    this.InboundLeg = InboundLeg;
};

exports.default = Quote;