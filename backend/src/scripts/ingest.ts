import { closeDynamoClient, ensureTableExists } from '../config/dynamo';
import { runIngestion } from '../services/ingestionService';
import { toError } from '../utils/errors';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  await ensureTableExists();
  await runIngestion();
}

main()
  .catch((error: unknown) => {
    const cause = toError(error);
    logger.error(cause.message, {
      errorMessage: cause.message,
      errorName: cause.name,
      stack: cause.stack,
    });
    process.exitCode = 1;
  })
  .finally(closeDynamoClient);
