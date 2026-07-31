import { DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { config } from '../../config';
import { closeDynamoClient, ensureTableExists } from '../../config/dynamo';
import { allMakesXml, singleVehicleTypeXml, vehicleTypesXml } from '../../mocks/vpicResponses';
import { runIngestion } from '../../services/ingestionService';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function xmlResponse(body: string): Response {
  return { ok: true, status: 200, text: async () => body } as Response;
}

function respondLikeVpic(url: string): Response {
  if (url.includes('getallmakes')) {
    return xmlResponse(allMakesXml);
  }
  if (url.includes('/GetVehicleTypesForMakeId/440')) {
    return xmlResponse(vehicleTypesXml);
  }
  return xmlResponse(singleVehicleTypeXml);
}

async function dropTable(): Promise<void> {
  const client = new DynamoDBClient({
    region: config.dynamo.region,
    endpoint: config.dynamo.endpoint,
    credentials: config.dynamo.credentials,
  });

  try {
    await client.send(new DeleteTableCommand({ TableName: config.dynamo.tableName }));
  } catch {
    // The table does not exist yet on the first run, which is the state we want anyway.
  } finally {
    client.destroy();
  }
}

describe('ingestion to GraphQL end to end', () => {
  let app: Express;

  beforeAll(async () => {
    await dropTable();

    fetchMock.mockImplementation((url: string) => Promise.resolve(respondLikeVpic(url)));

    await ensureTableExists();
    await runIngestion();

    app = await createApp();
  });

  afterAll(() => {
    closeDynamoClient();
  });

  it('creates the table and stores every ingested make', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(limit: 50) { items { makeId } } }' })
      .expect(200);

    expect(response.body.data.makes.items).toHaveLength(3);
  });

  it('serves a stored make with the shape required by the contract', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: '{ make(makeId: "440") { makeId makeName vehicleTypes { typeId typeName } } }',
      })
      .expect(200);

    expect(response.body.data.make).toEqual({
      makeId: '440',
      makeName: 'ASTON MARTIN',
      vehicleTypes: [
        { typeId: '2', typeName: 'Passenger Car' },
        { typeId: '7', typeName: 'Multipurpose Passenger Vehicle (MPV)' },
      ],
    });
  });

  it('keeps ids as strings after a full round trip through DynamoDB', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ make(makeId: "12832429") { makeId makeName } }' })
      .expect(200);

    expect(response.body.data.make).toEqual({
      makeId: '12832429',
      makeName: '12832429 CANADA INC.',
    });
  });

  it('returns null for a make that was never ingested', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ make(makeId: "does-not-exist") { makeId } }' })
      .expect(200);

    expect(response.body.data.make).toBeNull();
    expect(response.body.errors).toBeUndefined();
  });

  it('paginates through the stored makes without repeating items', async () => {
    const first = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(limit: 2) { items { makeId } nextCursor } }' })
      .expect(200);

    const { items, nextCursor } = first.body.data.makes;
    expect(items).toHaveLength(2);
    expect(nextCursor).toEqual(expect.any(String));

    const second = await request(app)
      .post('/graphql')
      .send({
        query: 'query Next($cursor: String) { makes(limit: 2, cursor: $cursor) { items { makeId } } }',
        variables: { cursor: nextCursor },
      })
      .expect(200);

    const firstIds = items.map((item: { makeId: string }) => item.makeId);
    const secondIds = second.body.data.makes.items.map((item: { makeId: string }) => item.makeId);

    expect(secondIds.filter((id: string) => firstIds.includes(id))).toHaveLength(0);
  });

  it('caps the page size regardless of the requested limit', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(limit: 9999) { items { makeId } } }' })
      .expect(200);

    expect(response.body.data.makes.items.length).toBeLessThanOrEqual(100);
  });

  it('rejects an unknown field without leaking a stack trace', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(limit: 1) { items { unknownField } } }' })
      .expect(400);

    expect(response.body.errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
    expect(response.body.errors[0].extensions.stacktrace).toBeUndefined();
  });

  it('surfaces a corrupt cursor as a typed error', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(cursor: "corrupt") { items { makeId } } }' })
      .expect(200);

    expect(response.body.errors[0].extensions.code).toBe('PersistenceError');
    expect(response.body.errors[0].extensions.stacktrace).toBeUndefined();
  });

  it('still answers the health check', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('is idempotent: re-running the ingestion does not duplicate makes', async () => {
    await runIngestion();

    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ makes(limit: 50) { items { makeId } } }' })
      .expect(200);

    expect(response.body.data.makes.items).toHaveLength(3);
  });
});
