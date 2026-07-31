import { Router } from 'express';
import { createGraphqlHandler } from '../graphql';

export async function createRouter(): Promise<Router> {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  router.use('/graphql', await createGraphqlHandler());

  return router;
}
