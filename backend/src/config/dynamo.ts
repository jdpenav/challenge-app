import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { buildVehicleMakesTable } from '../models/vehicleMakeTable';
import { PersistenceError, toError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from './index';

const TABLE_READY_TIMEOUT_SECONDS = 30;

const client = new DynamoDBClient({
  region: config.dynamo.region,
  ...(config.dynamo.endpoint
    ? { endpoint: config.dynamo.endpoint, credentials: config.dynamo.credentials }
    : {}),
});

export const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    throw new PersistenceError('Could not verify whether the table exists', {
      cause: toError(error),
      context: { tableName },
    });
  }
}

export async function ensureTableExists(): Promise<void> {
  const tableName = config.dynamo.tableName;

  if (await tableExists(tableName)) {
    logger.debug('Table already exists', { tableName });
    return;
  }

  try {
    logger.info('Creating table', { tableName });
    await client.send(new CreateTableCommand(buildVehicleMakesTable(tableName)));
    await waitUntilTableExists(
      { client, maxWaitTime: TABLE_READY_TIMEOUT_SECONDS },
      { TableName: tableName },
    );
    logger.info('Table created', { tableName });
  } catch (error) {
    throw new PersistenceError('Could not create the table', {
      cause: toError(error),
      context: { tableName },
    });
  }
}

export function closeDynamoClient(): void {
  client.destroy();
}
