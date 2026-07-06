import type { Request, Response, NextFunction } from 'express';
import logger = require('../utils/logger');

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const errorName = err.errorName || 'INTERNAL_SERVER_ERROR';
  const timestamp = new Date().toISOString();

  logger.error(`${req.method} ${req.url} - Error: ${message}`, { error: errorName });

  res.status(statusCode).json({
    timestamp: timestamp,
    status: statusCode,
    error: errorName,
    message: message,
    path: req.originalUrl
  });
};

export = errorHandler;