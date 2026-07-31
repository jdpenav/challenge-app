export interface VpicMakeEntry {
  Make_ID?: string;
  Make_Name?: string;
}

export interface VpicVehicleTypeEntry {
  VehicleTypeId?: string;
  VehicleTypeName?: string;
}

type VpicResults<T> = T | T[] | '' | undefined;

export interface VpicAllMakesResponse {
  Response?: {
    Count?: string;
    Message?: string;
    Results?: { AllVehicleMakes?: VpicResults<VpicMakeEntry> } | '';
  };
}

export interface VpicVehicleTypesResponse {
  Response?: {
    Count?: string;
    Message?: string;
    SearchCriteria?: string;
    Results?: { VehicleTypesForMakeIds?: VpicResults<VpicVehicleTypeEntry> } | '';
  };
}
