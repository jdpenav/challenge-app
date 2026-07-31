import {
  BatchWriteCommand,
  type BatchWriteCommandInput,
  GetCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import { documentClient } from '../config/dynamo';
import type { VehicleMake, VehicleMakeItem } from '../models/vehicle';
import { PersistenceError, toError } from '../utils/errors';
import { logger } from '../utils/logger';

const BATCH_SIZE = 25;
const MAX_BATCH_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;

type WriteRequests = NonNullable<BatchWriteCommandInput['RequestItems']>[string];

export interface Page<T> {
  items: T[];
  nextCursor: string | undefined;
}

const tableName = config.dynamo.tableName;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function* chunked<T>(items: T[], size: number): Generator<T[]> {
  for (let index = 0; index < items.length; index += size) {
    yield items.slice(index, index + size);
  }
}

function encodeCursor(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

function decodeCursor(cursor: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString()) as Record<string, unknown>;
  } catch (error) {
    throw new PersistenceError('Invalid pagination cursor', {
      cause: toError(error),
      context: { cursor },
    });
  }
}

async function writeChunk(chunk: VehicleMake[], ingestedAt: string): Promise<void> {
  let pending: WriteRequests = chunk.map((make) => ({
    PutRequest: { Item: { ...make, ingestedAt } },
  }));

  for (let attempt = 1; attempt <= MAX_BATCH_RETRIES + 1; attempt += 1) {
    let unprocessed: WriteRequests;

    try {
      const response = await documentClient.send(
        new BatchWriteCommand({ RequestItems: { [tableName]: pending } }),
      );
      unprocessed = response.UnprocessedItems?.[tableName] ?? [];
    } catch (error) {
      throw new PersistenceError('Failed to write a batch of vehicle makes', {
        cause: toError(error),
        context: { tableName, batchSize: pending.length },
      });
    }

    if (unprocessed.length === 0) {
      return;
    }

    logger.warn('DynamoDB returned unprocessed items', {
      tableName,
      unprocessed: unprocessed.length,
      attempt,
    });

    pending = unprocessed;
    await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
  }

  throw new PersistenceError('Batch write left unprocessed items after retrying', {
    context: { tableName, unprocessed: pending.length },
  });
}

export async function saveMany(makes: VehicleMake[], ingestedAt: string): Promise<number> {
  for (const chunk of chunked(makes, BATCH_SIZE)) {
    await writeChunk(chunk, ingestedAt);
  }
  return makes.length;
}

export async function findById(makeId: string): Promise<VehicleMakeItem | undefined> {
  try {
    const response = await documentClient.send(
      new GetCommand({ TableName: tableName, Key: { makeId } }),
    );
    return response.Item as VehicleMakeItem | undefined;
  } catch (error) {
    throw new PersistenceError('Failed to read a vehicle make', {
      cause: toError(error),
      context: { tableName, makeId },
    });
  }
}

export async function findAll(limit: number, cursor?: string): Promise<Page<VehicleMakeItem>> {
  try {
    const response = await documentClient.send(
      new ScanCommand({
        TableName: tableName,
        Limit: limit,
        ExclusiveStartKey: cursor ? decodeCursor(cursor) : undefined,
      }),
    );

    return {
      items: (response.Items ?? []) as VehicleMakeItem[],
      nextCursor: response.LastEvaluatedKey ? encodeCursor(response.LastEvaluatedKey) : undefined,
    };
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError('Failed to list vehicle makes', {
      cause: toError(error),
      context: { tableName, limit },
    });
  }
}
