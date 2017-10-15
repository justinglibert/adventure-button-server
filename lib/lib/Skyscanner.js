import 'es6-promise';
import 'isomorphic-fetch';
import querystring from 'query-string';

import QuoteSet from './QuoteSet';

export default class Skyscanner {

    constructor(api_key) {
        this.api_key = api_key;
        this.base_url = 'http://partners.api.skyscanner.net/apiservices/';

        this.setLocale('en-GB');
        this.setMarket('GB');
        this.setCurrency('GBP');

        this.setVersion('1.0');
    }

    shortApiKey() {
        return this.api_key.substr(0, 16);
    }

    setLocale(locale) {
        this.locale = locale;
    }

    setVersion(version) {
        this.version = `v${version}`;
    }

    setMarket(market) {
        this.market = market;
    }

    setCurrency(currency) {
        this.currency = currency;
    }

    endpoint(parts, params) {
        return `${this.base_url}${parts.join('/')}?${querystring.stringify(params)}`;
    }

    get(...args) {
        let params = {apiKey: this.api_key};

        var last = args[ args.length - 1 ];

        if ( typeof last == 'object' ) {
            args.pop(-1);
            params = Object.assign(params, last);
        }

        const endpoint = this.endpoint(args, params);

        return fetch(endpoint)
            .then(res => {
                return res.text()
            })
            .then(res => {
                return JSON.parse(res);
            });
    }

    locales() {
        return this.get('reference', this.version, 'locales')
            .then(r => r.Locales);
    }

    markets(locale = this.locale) {
        return this.get('reference', this.version, 'countries', locale)
            .then(r => r.Countries);
    }

    currencies() {
        return this.get('reference', this.version, 'currencies')
            .then(r => r.Currencies);
    }


    autosuggest(query) {
        return this.get('autosuggest', this.version, this.market, this.currency, this.locale, {query})
            .then(r => r.Places);
    }

    autosuggestLocation(id) {
        return this.get('autosuggest', this.version, this.market, this.currency, this.locale, {id})
        .then(r => r.Places);
    }

    browsequotes(originPlace, destinationPlace = 'everywhere', outboundPartialDate, inboundPartialDate) {
        return this.get('browsequotes', this.version, this.market, this.currency, this.locale, originPlace, destinationPlace, outboundPartialDate, inboundPartialDate)
            .then(r => {
                const referral_url = this.referral(originPlace, destinationPlace, outboundPartialDate, inboundPartialDate)
                return new QuoteSet(r.Quotes, r.Places, r.Carriers, r.Currencies, referral_url);
            })
    }

    referral(originPlace, destinationPlace, outboundPartialDate, inboundPartialDate) {
        outboundPartialDate = outboundPartialDate.substr(0, '2016-01-01'.length);
        inboundPartialDate = inboundPartialDate.substr(0, '2016-01-01'.length);

        return this.endpoint(['referral', this.version, this.market, this.currency, this.locale, originPlace, destinationPlace, outboundPartialDate, inboundPartialDate], {apiKey: this.shortApiKey()});
    }
}