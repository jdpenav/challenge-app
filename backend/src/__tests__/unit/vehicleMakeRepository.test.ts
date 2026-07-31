import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import type { VehicleMake } from '../../models/vehicle';
import { findAll, findById, saveMany } from '../../repositories/vehicleMakeRepository';
import { PersistenceError } from '../../utils/errors';

const dynamoMock = mockClient(DynamoDBDocumentClient);
const TABLE = 'TestVehicleMakes';
const INGESTED_AT = '2026-07-31T00:00:00.000Z';

function makes(count: number): VehicleMake[] {
  return Array.from({ length: count }, (_, index) => ({
    makeId: `make-${index}`,
    makeName: `MAKE ${index}`,
    vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
  }));
}

beforeEach(() => {
  dynamoMock.reset();
});

describe('saveMany', () => {
  it('writes a single batch when there are 25 items or fewer', async () => {
    dynamoMock.on(BatchWriteCommand).resolves({});

    await expect(saveMany(makes(25), INGESTED_AT)).resolves.toBe(25);
    expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(1);
  });

  it('splits larger sets into batches of 25', async () => {
    dynamoMock.on(BatchWriteCommand).resolves({});

    await saveMany(makes(57), INGESTED_AT);

    const calls = dynamoMock.commandCalls(BatchWriteCommand);
    expect(calls).toHaveLength(3);
    expect(calls[0]?.args[0].input.RequestItems?.[TABLE]).toHaveLength(25);
    expect(calls[2]?.args[0].input.RequestItems?.[TABLE]).toHaveLength(7);
  });

  it('stamps every item with the ingestion timestamp', async () => {
    dynamoMock.on(BatchWriteCommand).resolves({});

    await saveMany(makes(1), INGESTED_AT);

    const request = dynamoMock.commandCalls(BatchWriteCommand)[0]?.args[0].input.RequestItems?.[
      TABLE
    ]?.[0];
    expect(request?.PutRequest?.Item).toEqual({
      makeId: 'make-0',
      makeName: 'MAKE 0',
      vehicleTypes: [{ typeId: '2', typeName: 'Passenger Car' }],
      ingestedAt: INGESTED_AT,
    });
  });

  it('does nothing when given an empty list', async () => {
    await expect(saveMany([], INGESTED_AT)).resolves.toBe(0);
    expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(0);
  });

  it('retries items DynamoDB could not process', async () => {
    const unprocessed = { PutRequest: { Item: { makeId: 'make-0' } } };
    dynamoMock
      .on(BatchWriteCommand)
      .resolvesOnce({ UnprocessedItems: { [TABLE]: [unprocessed] } })
      .resolves({});

    await saveMany(makes(2), INGESTED_AT);

    expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(2);
  });

  it('throws PersistenceError when items stay unprocessed after retrying', async () => {
    const unprocessed = { PutRequest: { Item: { makeId: 'make-0' } } };
    dynamoMock.on(BatchWriteCommand).resolves({ UnprocessedItems: { [TABLE]: [unprocessed] } });

    await expect(saveMany(makes(1), INGESTED_AT)).rejects.toThrow(PersistenceError);
  });

  it('wraps SDK failures in PersistenceError and keeps the cause', async () => {
    const sdkError = new Error('ProvisionedThroughputExceededException');
    dynamoMock.on(BatchWriteCommand).rejects(sdkError);

    await expect(saveMany(makes(1), INGESTED_AT)).rejects.toMatchObject({
      name: 'PersistenceError',
      cause: sdkError,
    });
  });
});

describe('findById', () => {
  it('reads an item by its partition key', async () => {
    const item = {
      makeId: '440',
      makeName: 'ASTON MARTIN',
      vehicleTypes: [],
      ingestedAt: INGESTED_AT,
    };
    dynamoMock.on(GetCommand).resolves({ Item: item });

    await expect(findById('440')).resolves.toEqual(item);
    expect(dynamoMock.commandCalls(GetCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Key: { makeId: '440' },
    });
  });

  it('returns undefined when the item does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({});
    await expect(findById('missing')).resolves.toBeUndefined();
  });

  it('wraps SDK failures in PersistenceError', async () => {
    dynamoMock.on(GetCommand).rejects(new Error('boom'));
    await expect(findById('440')).rejects.toThrow(PersistenceError);
  });
});

describe('findAll', () => {
  it('scans with the requested limit and no cursor', async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [] });

    await findAll(10);

    expect(dynamoMock.commandCalls(ScanCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Limit: 10,
      ExclusiveStartKey: undefined,
    });
  });

  it('returns an encoded cursor when more pages remain', async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [], LastEvaluatedKey: { makeId: '440' } });

    const page = await findAll(10);

    expect(page.nextCursor).toBe(Buffer.from('{"makeId":"440"}').toString('base64url'));
  });

  it('returns no cursor on the last page', async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [] });
    await expect(findAll(10)).resolves.toEqual({ items: [], nextCursor: undefined });
  });

  it('decodes a cursor back into the exclusive start key', async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [] });
    const cursor = Buffer.from('{"makeId":"440"}').toString('base64url');

    await findAll(10, cursor);

    expect(dynamoMock.commandCalls(ScanCommand)[0]?.args[0].input.ExclusiveStartKey).toEqual({
      makeId: '440',
    });
  });

  it('throws PersistenceError on a corrupt cursor', async () => {
    await expect(findAll(10, 'not-a-valid-cursor')).rejects.toThrow(PersistenceError);
    expect(dynamoMock.commandCalls(ScanCommand)).toHaveLength(0);
  });

  it('wraps SDK failures in PersistenceError', async () => {
    dynamoMock.on(ScanCommand).rejects(new Error('boom'));
    await expect(findAll(10)).rejects.toThrow(PersistenceError);
  });
});
