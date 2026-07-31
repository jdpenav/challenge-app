import type { Server } from 'node:http';
import { createApp } from './app';
import { config } from './config';
import { closeDynamoClient, ensureTableExists } from './config/dynamo';
import { runIngestion } from './services/ingestionService';
import { toError } from './utils/errors';
import { logger } from './utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

function logFailure(error: unknown): void {
  const cause = toError(error);
  logger.error(cause.message, {
    errorMessage: cause.message,
    errorName: cause.name,
    stack: cause.stack,
  });
}

async function bootstrapData(): Promise<void> {
  try {
    await ensureTableExists();
    if (config.ingestion.runOnStartup) {
      await runIngestion();
    }
  } catch (error) {
    logFailure(error);
  }
}

function shutdown(signal: string): void {
  if (shuttingDown || !server) {
    return;
  }
  shuttingDown = true;

  logger.info('Shutdown signal received', { signal });

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    closeDynamoClient();

    if (error) {
      logFailure(error);
      process.exit(1);
    }

    logger.info('Service stopped');
    process.exit(0);
  });
}

async function start(): Promise<void> {
  const app = await createApp();

  server = app.listen(config.server.port, () => {
    logger.info('Service started', {
      port: config.server.port,
      env: config.env,
      nodeVersion: process.version,
    });

    void bootstrapData();
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logFailure(reason);
});

process.on('uncaughtException', (error) => {
  logFailure(error);
  process.exit(1);
});

start().catch((error: unknown) => {
  logFailure(error);
  process.exit(1);
});
