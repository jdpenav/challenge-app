import { fetchAllMakes, fetchVehicleTypesByMakeId } from '../clients/vpicClient';
import { config } from '../config';
import type { VehicleMake } from '../models/vehicle';
import { saveMany } from '../repositories/vehicleMakeRepository';
import { forEachWithConcurrency } from '../utils/concurrency';
import { toError } from '../utils/errors';
import { logger } from '../utils/logger';
import { toVehicleMake } from './transformService';

const PERSIST_CHUNK_SIZE = 250;

export interface IngestionSummary {
  available: number;
  selected: number;
  persisted: number;
  failed: number;
  durationMs: number;
}

export async function runIngestion(): Promise<IngestionSummary> {
  const startedAt = Date.now();
  const ingestedAt = new Date().toISOString();
  const { concurrency, maxMakes } = config.ingestion;

  logger.info('Ingestion started', { concurrency, maxMakes });

  const entries = await fetchAllMakes();
  const selected = maxMakes > 0 ? entries.slice(0, maxMakes) : entries;

  logger.info('Makes fetched', { available: entries.length, selected: selected.length });

  const buffer: VehicleMake[] = [];
  let persisted = 0;
  let failed = 0;

  const flush = async (): Promise<void> => {
    const chunk = buffer.splice(0, buffer.length);
    if (chunk.length === 0) {
      return;
    }

    persisted += await saveMany(chunk, ingestedAt);
    logger.info('Progress persisted', {
      persisted,
      failed,
      pending: selected.length - persisted - failed,
    });
  };

  await forEachWithConcurrency(selected, concurrency, async (entry) => {
    try {
      const types = await fetchVehicleTypesByMakeId(String(entry.Make_ID));
      buffer.push(toVehicleMake(entry, types));
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

    if (buffer.length >= PERSIST_CHUNK_SIZE) {
      await flush();
    }
  });

  await flush();

  const summary: IngestionSummary = {
    available: entries.length,
    selected: selected.length,
    persisted,
    failed,
    durationMs: Date.now() - startedAt,
  };

  logger.info('Ingestion finished', { ...summary });

  return summary;
}
