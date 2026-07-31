export interface VehicleType {
  typeId: string;
  typeName: string;
}

export interface VehicleMake {
  makeId: string;
  makeName: string;
  vehicleTypes: VehicleType[];
}

export interface VehicleMakeItem extends VehicleMake {
  ingestedAt: string;
}
