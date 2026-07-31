import { fetchAllMakes, fetchVehicleTypesByMakeId } from '../../clients/vpicClient';
import {
  allMakesXml,
  emptyResultsXml,
  malformedXml,
  singleVehicleTypeXml,
  vehicleTypesXml,
} from '../../mocks/vpicResponses';
import { ExternalApiError, XmlParseError } from '../../utils/errors';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function ok(body: string): Response {
  return { ok: true, status: 200, text: async () => body } as Response;
}

function failure(status: number): Response {
  return { ok: false, status, text: async () => '' } as Response;
}

describe('fetchAllMakes', () => {
  it('requests the makes endpoint in XML format', async () => {
    fetchMock.mockResolvedValue(ok(allMakesXml));

    await fetchAllMakes();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://vpic.test/api/vehicles/getallmakes?format=XML',
    );
  });

  it('returns the parsed make entries', async () => {
    fetchMock.mockResolvedValue(ok(allMakesXml));

    const makes = await fetchAllMakes();

    expect(makes).toHaveLength(3);
    expect(makes[0]).toEqual({ Make_ID: '440', Make_Name: 'ASTON MARTIN' });
  });

  it('returns an empty array when the API reports no results', async () => {
    fetchMock.mockResolvedValue(ok(emptyResultsXml));
    await expect(fetchAllMakes()).resolves.toEqual([]);
  });

  it('throws XmlParseError when the payload is not valid XML', async () => {
    fetchMock.mockResolvedValue(ok(malformedXml));
    await expect(fetchAllMakes()).rejects.toThrow(XmlParseError);
  });
});

describe('fetchVehicleTypesByMakeId', () => {
  it('builds the url with the make id', async () => {
    fetchMock.mockResolvedValue(ok(vehicleTypesXml));

    await fetchVehicleTypesByMakeId('440');

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://vpic.test/api/vehicles/GetVehicleTypesForMakeId/440?format=xml',
    );
  });

  it('encodes unusual make ids', async () => {
    fetchMock.mockResolvedValue(ok(vehicleTypesXml));

    await fetchVehicleTypesByMakeId('a b/c');

    expect(fetchMock.mock.calls[0]?.[0]).toContain('a%20b%2Fc');
  });

  it('normalises a single vehicle type into an array', async () => {
    fetchMock.mockResolvedValue(ok(singleVehicleTypeXml));

    const types = await fetchVehicleTypesByMakeId('448');

    expect(types).toEqual([{ VehicleTypeId: '6', VehicleTypeName: 'Trailer' }]);
  });
});

describe('retry behaviour', () => {
  it('retries a 503 and succeeds on a later attempt', async () => {
    fetchMock.mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(ok(vehicleTypesXml));

    const types = await fetchVehicleTypesByMakeId('440');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(types).toHaveLength(2);
  });

  it('does not retry a 404', async () => {
    fetchMock.mockResolvedValue(failure(404));

    await expect(fetchVehicleTypesByMakeId('440')).rejects.toThrow(ExternalApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a 400', async () => {
    fetchMock.mockResolvedValue(failure(400));

    await expect(fetchAllMakes()).rejects.toThrow(ExternalApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 403, which is how vPIC signals throttling', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValueOnce(failure(403)).mockResolvedValueOnce(ok(allMakesXml));

    const pending = fetchAllMakes();
    await jest.runAllTimersAsync();
    const makes = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(makes).toHaveLength(3);
    jest.useRealTimers();
  });

  it('backs off for longer when throttled than on an ordinary retry', async () => {
    jest.useFakeTimers();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    fetchMock.mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(ok(allMakesXml));
    let pending = fetchAllMakes();
    await jest.runAllTimersAsync();
    await pending;
    const ordinaryDelay = Number(timeoutSpy.mock.calls[0]?.[1]);

    timeoutSpy.mockClear();
    fetchMock.mockResolvedValueOnce(failure(403)).mockResolvedValueOnce(ok(allMakesXml));
    pending = fetchAllMakes();
    await jest.runAllTimersAsync();
    await pending;
    const throttledDelay = Number(timeoutSpy.mock.calls[0]?.[1]);

    expect(throttledDelay).toBeGreaterThan(ordinaryDelay);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it('retries a 429 until the attempts are exhausted', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(failure(429));

    const pending = expect(fetchAllMakes()).rejects.toThrow(ExternalApiError);
    await jest.runAllTimersAsync();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it('retries network failures and preserves the original cause', async () => {
    const networkError = new Error('connect ECONNREFUSED');
    fetchMock.mockRejectedValue(networkError);

    await expect(fetchAllMakes()).rejects.toMatchObject({
      name: 'ExternalApiError',
      cause: networkError,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('records the status and url in the error context', async () => {
    expect.assertions(2);
    fetchMock.mockResolvedValue(failure(404));

    try {
      await fetchVehicleTypesByMakeId('440');
    } catch (error) {
      const context = (error as ExternalApiError).context;
      expect(context.status).toBe(404);
      expect(context.makeId).toBe('440');
    }
  });

  it('aborts each attempt with a timeout signal', async () => {
    fetchMock.mockResolvedValue(ok(allMakesXml));

    await fetchAllMakes();

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
