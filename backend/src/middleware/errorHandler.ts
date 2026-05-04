import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: CustomError | ZodError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    const statusCode = 400;
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message: 'Error de validación',
      errors: formattedErrors,
    });
    return;
  }

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
