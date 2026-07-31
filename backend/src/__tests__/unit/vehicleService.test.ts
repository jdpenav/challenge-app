import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  getMakeById,
  listMakes,
  resolvePageSize,
} from '../../services/vehicleService';
import * as repository from '../../repositories/vehicleMakeRepository';

jest.mock('../../repositories/vehicleMakeRepository');

const findAll = jest.mocked(repository.findAll);
const findById = jest.mocked(repository.findById);

describe('resolvePageSize', () => {
  it('falls back to the default when no limit is given', () => {
    expect(resolvePageSize()).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('caps the limit at the maximum', () => {
    expect(resolvePageSize(999)).toBe(MAX_PAGE_SIZE);
    expect(resolvePageSize(MAX_PAGE_SIZE + 1)).toBe(MAX_PAGE_SIZE);
  });

  it('raises non positive limits to one', () => {
    expect(resolvePageSize(0)).toBe(1);
    expect(resolvePageSize(-5)).toBe(1);
  });

  it('keeps a limit inside the allowed range', () => {
    expect(resolvePageSize(10)).toBe(10);
    expect(resolvePageSize(MAX_PAGE_SIZE)).toBe(MAX_PAGE_SIZE);
  });

  it('truncates fractional limits', () => {
    expect(resolvePageSize(7.9)).toBe(7);
  });
});

describe('listMakes', () => {
  beforeEach(() => {
    findAll.mockResolvedValue({ items: [], nextCursor: undefined });
  });

  it('forwards the resolved page size to the repository', async () => {
    await listMakes(500);
    expect(findAll).toHaveBeenCalledWith(MAX_PAGE_SIZE, undefined);
  });

  it('forwards the cursor when present', async () => {
    await listMakes(10, 'cursor-abc');
    expect(findAll).toHaveBeenCalledWith(10, 'cursor-abc');
  });

  it('normalises a null cursor to undefined', async () => {
    await listMakes(10, null);
    expect(findAll).toHaveBeenCalledWith(10, undefined);
  });
});

describe('getMakeById', () => {
  it('delegates to the repository', async () => {
    const item = {
      makeId: '440',
      makeName: 'ASTON MARTIN',
      vehicleTypes: [],
      ingestedAt: '2026-07-31T00:00:00.000Z',
    };
    findById.mockResolvedValue(item);

    await expect(getMakeById('440')).resolves.toEqual(item);
    expect(findById).toHaveBeenCalledWith('440');
  });

  it('returns undefined when the make does not exist', async () => {
    findById.mockResolvedValue(undefined);
    await expect(getMakeById('missing')).resolves.toBeUndefined();
  });
});
