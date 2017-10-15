export default class Quote {

    constructor(QuoteId, Currency, MinPrice, Direct, OutboundLeg, InboundLeg) {
        this.QuoteId = QuoteId;
        this.Currency = Currency;
        this.MinPrice = MinPrice;
        this.Direct = Direct;
        this.OutboundLeg = OutboundLeg;
        this.InboundLeg = InboundLeg;
    }
}