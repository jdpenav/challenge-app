import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = createApp().listen(config.server.port, () => {
  logger.info('Service started', {
    port: config.server.port,
    env: config.env,
    nodeVersion: process.version,
  });
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
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
    if (error) {
      logger.error(error.message, {
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack,
      });
      process.exit(1);
    }

    logger.info('Service stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error(error.message, {
    errorMessage: error.message,
    errorName: error.name,
    stack: error.stack,
  });
});

process.on('uncaughtException', (error) => {
  logger.error(error.message, {
    errorMessage: error.message,
    errorName: error.name,
    stack: error.stack,
  });
  process.exit(1);
});
