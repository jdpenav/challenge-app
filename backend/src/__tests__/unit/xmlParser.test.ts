import {
  allMakesXml,
  emptyResultsXml,
  htmlErrorPage,
  malformedXml,
  singleVehicleTypeXml,
  vehicleTypesXml,
} from '../../mocks/vpicResponses';
import type { VpicAllMakesResponse, VpicVehicleTypesResponse } from '../../models/vpic';
import { XmlParseError } from '../../utils/errors';
import { parseXml, toArray } from '../../utils/xmlParser';

describe('parseXml', () => {
  it('parses a well formed vPIC response', () => {
    const parsed = parseXml<VpicAllMakesResponse>(allMakesXml);
    const results = parsed.Response?.Results;

    expect(results).not.toBe('');
    expect(toArray(typeof results === 'object' ? results.AllVehicleMakes : undefined)).toHaveLength(
      3,
    );
  });

  it('keeps every value as a string so ids never lose precision', () => {
    const parsed = parseXml<VpicAllMakesResponse>(allMakesXml);
    const results = parsed.Response?.Results;
    const entries = toArray(typeof results === 'object' ? results.AllVehicleMakes : undefined);

    expect(entries[2]?.Make_ID).toBe('12832429');
    expect(typeof entries[2]?.Make_ID).toBe('string');
  });

  it('throws XmlParseError on malformed XML', () => {
    expect(() => parseXml(malformedXml)).toThrow(XmlParseError);
  });

  it('throws XmlParseError when the payload is an HTML error page', () => {
    expect(() => parseXml(htmlErrorPage)).toThrow(XmlParseError);
  });

  it('throws XmlParseError on an empty payload', () => {
    expect(() => parseXml('')).toThrow(XmlParseError);
    expect(() => parseXml('   \n  ')).toThrow(XmlParseError);
  });

  it('reports the offending position in the error context', () => {
    expect.assertions(2);
    try {
      parseXml(malformedXml, { operation: 'test' });
    } catch (error) {
      const context = (error as XmlParseError).context;
      expect(context.operation).toBe('test');
      expect(context).toHaveProperty('line');
    }
  });
});

describe('toArray', () => {
  it('wraps a single object into an array', () => {
    const parsed = parseXml<VpicVehicleTypesResponse>(singleVehicleTypeXml);
    const results = parsed.Response?.Results;
    const entries = toArray(
      typeof results === 'object' ? results.VehicleTypesForMakeIds : undefined,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({ VehicleTypeId: '6', VehicleTypeName: 'Trailer' });
  });

  it('leaves an existing array untouched', () => {
    const parsed = parseXml<VpicVehicleTypesResponse>(vehicleTypesXml);
    const results = parsed.Response?.Results;

    expect(
      toArray(typeof results === 'object' ? results.VehicleTypesForMakeIds : undefined),
    ).toHaveLength(2);
  });

  it('returns an empty array for empty results', () => {
    const parsed = parseXml<VpicAllMakesResponse>(emptyResultsXml);
    const results = parsed.Response?.Results;

    expect(toArray(typeof results === 'object' ? results.AllVehicleMakes : undefined)).toEqual([]);
  });

  it('returns an empty array for null, undefined and empty string', () => {
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(null)).toEqual([]);
    expect(toArray('')).toEqual([]);
  });
});
