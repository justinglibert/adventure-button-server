export default class Place {

    constructor(PlaceId, IataCode, Name, Type, SkyscannerCode, CityName, CityId, CountryName) {
        this.PlaceId = PlaceId;
        this.IataCode = IataCode;
        this.Name = Name;
        this.Type = Type;
        this.SkyscannerCode = SkyscannerCode;
        this.CityName = CityName;
        this.CityId = CityId
        this.CountryName = CountryName;
    }

}