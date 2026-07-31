import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRouter } from './routes';

export async function createApp(): Promise<Express> {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use(await createRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
