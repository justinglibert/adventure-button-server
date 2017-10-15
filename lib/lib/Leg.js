export default class Leg {

    constructor(DepartureDate, Origin, Destination, Carriers = []) {
        this.DepartureDate = DepartureDate;
        this.Origin = Origin;
        this.Destination = Destination;
        this.Carriers = Carriers;
    }

}
