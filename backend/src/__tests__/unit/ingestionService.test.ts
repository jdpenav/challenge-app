import * as vpicClient from '../../clients/vpicClient';
import { config } from '../../config';
import type { VpicMakeEntry } from '../../models/vpic';
import * as repository from '../../repositories/vehicleMakeRepository';
import { runIngestion } from '../../services/ingestionService';
import { ExternalApiError } from '../../utils/errors';

jest.mock('../../clients/vpicClient');
jest.mock('../../repositories/vehicleMakeRepository');

const fetchAllMakes = jest.mocked(vpicClient.fetchAllMakes);
const fetchVehicleTypesByMakeId = jest.mocked(vpicClient.fetchVehicleTypesByMakeId);
const saveMany = jest.mocked(repository.saveMany);

const originalMaxMakes = config.ingestion.maxMakes;

function makeEntries(count: number): VpicMakeEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    Make_ID: String(index),
    Make_Name: `MAKE ${index}`,
  }));
}

beforeEach(() => {
  fetchVehicleTypesByMakeId.mockResolvedValue([
    { VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' },
  ]);
  saveMany.mockImplementation(async (makes) => makes.length);
});

afterEach(() => {
  config.ingestion.maxMakes = originalMaxMakes;
});

describe('runIngestion', () => {
  it('transforms and persists every make', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(3));

    const summary = await runIngestion();

    expect(summary).toMatchObject({ available: 3, selected: 3, persisted: 3, failed: 0 });
    expect(saveMany).toHaveBeenCalledTimes(1);
    expect(saveMany.mock.calls[0]?.[0]).toEqual([
      {
        makeId: '0',
        makeName: 'MAKE 0',
        vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
      },
      {
        makeId: '1',
        makeName: 'MAKE 1',
        vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
      },
      {
        makeId: '2',
        makeName: 'MAKE 2',
        vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
      },
    ]);
  });

  it('requests the vehicle types of every selected make', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(4));

    await runIngestion();

    expect(fetchVehicleTypesByMakeId).toHaveBeenCalledTimes(4);
  });

  it('stamps every make in a run with the same timestamp', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(2));

    await runIngestion();

    expect(saveMany.mock.calls[0]?.[1]).toEqual(expect.any(String));
    expect(new Date(saveMany.mock.calls[0]![1]).toISOString()).toBe(saveMany.mock.calls[0]![1]);
  });

  it('honours INGESTION_MAX_MAKES', async () => {
    config.ingestion.maxMakes = 2;
    fetchAllMakes.mockResolvedValue(makeEntries(10));

    const summary = await runIngestion();

    expect(summary).toMatchObject({ available: 10, selected: 2, persisted: 2 });
    expect(fetchVehicleTypesByMakeId).toHaveBeenCalledTimes(2);
  });

  it('ingests everything when INGESTION_MAX_MAKES is zero', async () => {
    config.ingestion.maxMakes = 0;
    fetchAllMakes.mockResolvedValue(makeEntries(7));

    await expect(runIngestion()).resolves.toMatchObject({ selected: 7, persisted: 7 });
  });

  it('persists in chunks instead of waiting until the end', async () => {
    config.ingestion.maxMakes = 0;
    fetchAllMakes.mockResolvedValue(makeEntries(300));

    const summary = await runIngestion();

    expect(saveMany).toHaveBeenCalledTimes(2);
    expect(saveMany.mock.calls[0]?.[0]).toHaveLength(250);
    expect(saveMany.mock.calls[1]?.[0]).toHaveLength(50);
    expect(summary.persisted).toBe(300);
  });

  it('keeps going when a single make fails and counts it', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(3));
    fetchVehicleTypesByMakeId.mockImplementation(async (makeId) => {
      if (makeId === '1') {
        throw new ExternalApiError('vPIC is down');
      }
      return [{ VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' }];
    });

    const summary = await runIngestion();

    expect(summary).toMatchObject({ selected: 3, persisted: 2, failed: 1 });
  });

  it('does not call the repository when every make fails', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(2));
    fetchVehicleTypesByMakeId.mockRejectedValue(new ExternalApiError('vPIC is down'));

    const summary = await runIngestion();

    expect(summary).toMatchObject({ persisted: 0, failed: 2 });
    expect(saveMany).not.toHaveBeenCalled();
  });

  it('handles an empty catalogue without touching the repository', async () => {
    fetchAllMakes.mockResolvedValue([]);

    const summary = await runIngestion();

    expect(summary).toMatchObject({ available: 0, selected: 0, persisted: 0, failed: 0 });
    expect(saveMany).not.toHaveBeenCalled();
  });

  it('propagates a failure to fetch the make catalogue', async () => {
    fetchAllMakes.mockRejectedValue(new ExternalApiError('vPIC is down'));

    await expect(runIngestion()).rejects.toThrow(ExternalApiError);
  });

  it('reports a duration', async () => {
    fetchAllMakes.mockResolvedValue(makeEntries(1));

    const summary = await runIngestion();

    expect(summary.durationMs).toEqual(expect.any(Number));
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});
