import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  logger.error({
    msg: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
