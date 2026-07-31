import { TransformationError } from '../../utils/errors';
import { toVehicleMake, toVehicleType } from '../../services/transformService';

describe('toVehicleType', () => {
  it('maps a vPIC entry to the contract shape', () => {
    expect(toVehicleType({ VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' })).toEqual({
      typeId: '2',
      typeName: 'Passenger Car',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(toVehicleType({ VehicleTypeId: ' 7 ', VehicleTypeName: '  Trailer  ' })).toEqual({
      typeId: '7',
      typeName: 'Trailer',
    });
  });

  it('throws when the id is missing', () => {
    expect(() => toVehicleType({ VehicleTypeName: 'Passenger Car' })).toThrow(TransformationError);
  });

  it('throws when the name is missing', () => {
    expect(() => toVehicleType({ VehicleTypeId: '2' })).toThrow(TransformationError);
  });

  it('keeps the offending entry in the error context', () => {
    expect.assertions(1);
    try {
      toVehicleType({ VehicleTypeId: '2' });
    } catch (error) {
      expect((error as TransformationError).context).toEqual({ entry: { VehicleTypeId: '2' } });
    }
  });
});

describe('toVehicleMake', () => {
  const makeEntry = { Make_ID: '440', Make_Name: 'ASTON MARTIN' };

  it('produces exactly the keys required by the contract', () => {
    const result = toVehicleMake(makeEntry, [
      { VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' },
    ]);

    expect(Object.keys(result)).toEqual(['makeId', 'makeName', 'vehicleTypes']);
    expect(Object.keys(result.vehicleTypes[0]!)).toEqual(['typeId', 'typeName']);
  });

  it('combines a make with its vehicle types', () => {
    const result = toVehicleMake(makeEntry, [
      { VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' },
      { VehicleTypeId: '7', VehicleTypeName: 'MPV' },
    ]);

    expect(result).toEqual({
      makeId: '440',
      makeName: 'ASTON MARTIN',
      vehicleTypes: [
        { typeId: '2', typeName: 'Passenger Car' },
        { typeId: '7', typeName: 'MPV' },
      ],
    });
  });

  it('returns an empty array when the make has no vehicle types', () => {
    expect(toVehicleMake(makeEntry).vehicleTypes).toEqual([]);
    expect(toVehicleMake(makeEntry, []).vehicleTypes).toEqual([]);
  });

  it('keeps numeric looking values as strings', () => {
    const result = toVehicleMake({ Make_ID: '12832429', Make_Name: '12832429 CANADA INC.' });

    expect(result.makeId).toBe('12832429');
    expect(typeof result.makeId).toBe('string');
    expect(result.makeName).toBe('12832429 CANADA INC.');
  });

  it('throws when Make_ID is missing', () => {
    expect(() => toVehicleMake({ Make_Name: 'NO ID' })).toThrow(TransformationError);
  });

  it('throws when Make_Name is missing', () => {
    expect(() => toVehicleMake({ Make_ID: '440' })).toThrow(TransformationError);
  });

  it('throws when a vehicle type inside the make is malformed', () => {
    expect(() => toVehicleMake(makeEntry, [{ VehicleTypeId: '2' }])).toThrow(TransformationError);
  });

  it('does not mutate the input entries', () => {
    const input = { Make_ID: '440', Make_Name: 'ASTON MARTIN' };
    const types = [{ VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' }];

    toVehicleMake(input, types);

    expect(input).toEqual({ Make_ID: '440', Make_Name: 'ASTON MARTIN' });
    expect(types).toEqual([{ VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' }]);
  });
});
