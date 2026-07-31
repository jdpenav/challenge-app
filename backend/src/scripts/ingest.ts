import { fetchAllMakes, fetchVehicleTypesByMakeId } from '../clients/vpicClient';
import { config } from '../config';
import type { VehicleMake } from '../models/vehicle';
import { toVehicleMake } from '../services/transformService';
import { toError } from '../utils/errors';
import { logger } from '../utils/logger';

async function run(): Promise<void> {
  const startedAt = Date.now();
  logger.info('Ingestion started', { maxMakes: config.ingestion.maxMakes });

  const entries = await fetchAllMakes();
  const selected =
    config.ingestion.maxMakes > 0 ? entries.slice(0, config.ingestion.maxMakes) : entries;

  logger.info('Makes fetched', { available: entries.length, selected: selected.length });

  const makes: VehicleMake[] = [];
  let failed = 0;

  for (const entry of selected) {
    try {
      const types = await fetchVehicleTypesByMakeId(String(entry.Make_ID));
      makes.push(toVehicleMake(entry, types));
    } catch (error) {
      const cause = toError(error);
      failed += 1;
      logger.error(cause.message, {
        errorMessage: cause.message,
        errorName: cause.name,
        stack: cause.stack,
        makeId: entry.Make_ID,
      });
    }
  }

  logger.info('Ingestion finished', {
    processed: makes.length,
    failed,
    durationMs: Date.now() - startedAt,
  });
  logger.debug('First transformed make', { make: makes[0] });
}

run().catch((error) => {
  const cause = toError(error);
  logger.error(cause.message, {
    errorMessage: cause.message,
    errorName: cause.name,
    stack: cause.stack,
  });
  process.exit(1);
});
