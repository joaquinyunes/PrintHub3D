import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ZodValidationSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export const zodValidator = (schemas: ZodValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        // Express 5 expone req.query como getter de solo lectura: no se puede reasignar.
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Error de validación',
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};
