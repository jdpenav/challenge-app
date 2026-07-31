import type { VehicleMakeItem } from '../../models/vehicle';
import type { Page } from '../../repositories/vehicleMakeRepository';
import { getMakeById, listMakes } from '../../services/vehicleService';

interface MakesArgs {
  limit?: number | null;
  cursor?: string | null;
}

interface MakeArgs {
  makeId: string;
}

export const resolvers = {
  Query: {
    makes: (_parent: unknown, args: MakesArgs): Promise<Page<VehicleMakeItem>> =>
      listMakes(args.limit, args.cursor),

    make: (_parent: unknown, args: MakeArgs): Promise<VehicleMakeItem | undefined> =>
      getMakeById(args.makeId),
  },
};
