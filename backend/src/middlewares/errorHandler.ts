import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(error.message, {
    errorMessage: error.message,
    errorName: error.name,
    stack: error.stack,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred while processing the request',
  });
}
