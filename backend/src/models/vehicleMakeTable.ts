import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

export const MAKE_ID_ATTRIBUTE = 'makeId';

export function buildVehicleMakesTable(tableName: string): CreateTableCommandInput {
  return {
    TableName: tableName,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [{ AttributeName: MAKE_ID_ATTRIBUTE, KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: MAKE_ID_ATTRIBUTE, AttributeType: 'S' }],
  };
}
