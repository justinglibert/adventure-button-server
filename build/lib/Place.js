"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Place = function Place(PlaceId, IataCode, Name, Type, SkyscannerCode, CityName, CityId, CountryName) {
    _classCallCheck(this, Place);

    this.PlaceId = PlaceId;
    this.IataCode = IataCode;
    this.Name = Name;
    this.Type = Type;
    this.SkyscannerCode = SkyscannerCode;
    this.CityName = CityName;
    this.CityId = CityId;
    this.CountryName = CountryName;
};

exports.default = Place;