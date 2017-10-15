"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Leg = function Leg(DepartureDate, Origin, Destination) {
    var Carriers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    _classCallCheck(this, Leg);

    this.DepartureDate = DepartureDate;
    this.Origin = Origin;
    this.Destination = Destination;
    this.Carriers = Carriers;
};

exports.default = Leg;