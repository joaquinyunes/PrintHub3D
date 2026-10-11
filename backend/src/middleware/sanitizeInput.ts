import { NextFunction, Request, Response } from 'express';

/**
 * Defensa contra inyección NoSQL: ninguna clave que venga del cliente puede
 * empezar con `$` ni contener `.` (así no llegan operadores como `$ne` / `$gt`
 * a un filtro de Mongoose). Las claves se renombran con prefijo `__` en vez de
 * descartarse, para que la validación posterior las rechace como campo desconocido.
 */
export const sanitizeValue = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src)) {
    const safeKey = key.startsWith('$') || key.includes('.') ? `__${key}` : key;
    out[safeKey] = sanitizeValue(src[key]);
  }
  return out;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  // req.query no se toca: Express 5 usa el parser "simple" (sin objetos anidados, así que
  // `?a[$ne]=1` llega como string) y el webhook de MercadoPago necesita la clave `data.id`.
  next();
};
