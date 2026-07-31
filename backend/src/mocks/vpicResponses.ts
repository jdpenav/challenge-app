const header = '<?xml version="1.0" encoding="utf-8"?>';
const responseAttributes =
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"';

export const allMakesXml = `${header}
<Response ${responseAttributes}>
  <Count>3</Count>
  <Message>Response returned successfully</Message>
  <Results>
    <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
    <AllVehicleMakes><Make_ID>448</Make_ID><Make_Name>FORD</Make_Name></AllVehicleMakes>
    <AllVehicleMakes><Make_ID>12832429</Make_ID><Make_Name>12832429 CANADA INC.</Make_Name></AllVehicleMakes>
  </Results>
</Response>`;

export const singleMakeXml = `${header}
<Response ${responseAttributes}>
  <Count>1</Count>
  <Message>Response returned successfully</Message>
  <Results>
    <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
  </Results>
</Response>`;

export const vehicleTypesXml = `${header}
<Response ${responseAttributes}>
  <Count>2</Count>
  <Message>Response returned successfully</Message>
  <SearchCriteria>Make ID: 440</SearchCriteria>
  <Results>
    <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
    <VehicleTypesForMakeIds><VehicleTypeId>7</VehicleTypeId><VehicleTypeName>Multipurpose Passenger Vehicle (MPV)</VehicleTypeName></VehicleTypesForMakeIds>
  </Results>
</Response>`;

export const singleVehicleTypeXml = `${header}
<Response ${responseAttributes}>
  <Count>1</Count>
  <Message>Response returned successfully</Message>
  <SearchCriteria>Make ID: 448</SearchCriteria>
  <Results>
    <VehicleTypesForMakeIds><VehicleTypeId>6</VehicleTypeId><VehicleTypeName>Trailer</VehicleTypeName></VehicleTypesForMakeIds>
  </Results>
</Response>`;

export const emptyResultsXml = `${header}
<Response ${responseAttributes}>
  <Count>0</Count>
  <Message>Response returned successfully</Message>
  <Results/>
</Response>`;

export const malformedXml = '<Response><Results><Make_ID>440</Make_ID></Response>';

export const htmlErrorPage = '<html><body><h1>502 Bad Gateway</h1></body>';

export const makeWithoutIdXml = `${header}
<Response ${responseAttributes}>
  <Count>1</Count>
  <Results>
    <AllVehicleMakes><Make_Name>MAKE WITHOUT ID</Make_Name></AllVehicleMakes>
  </Results>
</Response>`;
