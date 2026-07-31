import type { VehicleMakeItem } from '../models/vehicle';
import { findAll, findById, type Page } from '../repositories/vehicleMakeRepository';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function resolvePageSize(limit?: number | null): number {
  if (limit === undefined || limit === null || Number.isNaN(limit)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE_SIZE);
}

export function listMakes(limit?: number | null, cursor?: string | null): Promise<Page<VehicleMakeItem>> {
  return findAll(resolvePageSize(limit), cursor ?? undefined);
}

export function getMakeById(makeId: string): Promise<VehicleMakeItem | undefined> {
  return findById(makeId);
}
