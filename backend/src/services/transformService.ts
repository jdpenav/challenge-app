import type { VehicleMake, VehicleType } from '../models/vehicle';
import type { VpicMakeEntry, VpicVehicleTypeEntry } from '../models/vpic';
import { TransformationError } from '../utils/errors';

function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

export function toVehicleType(entry: VpicVehicleTypeEntry): VehicleType {
  const typeId = readText(entry?.VehicleTypeId);
  const typeName = readText(entry?.VehicleTypeName);

  if (typeId === '' || typeName === '') {
    throw new TransformationError(
      'Vehicle type entry is missing VehicleTypeId or VehicleTypeName',
      { context: { entry } },
    );
  }

  return { typeId, typeName };
}

export function toVehicleMake(
  makeEntry: VpicMakeEntry,
  typeEntries: VpicVehicleTypeEntry[] = [],
): VehicleMake {
  const makeId = readText(makeEntry?.Make_ID);
  const makeName = readText(makeEntry?.Make_Name);

  if (makeId === '' || makeName === '') {
    throw new TransformationError('Make entry is missing Make_ID or Make_Name', {
      context: { entry: makeEntry },
    });
  }

  return {
    makeId,
    makeName,
    vehicleTypes: typeEntries.map((entry) => toVehicleType(entry)),
  };
}
