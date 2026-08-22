import { Request } from 'express';

/**
 * Express 5 tipa los valores de req.params como `string | string[]` (soporta
 * parametros repetidos). Nuestras rutas usan siempre `:param` simple, asi que
 * normalizamos a string.
 */
export const reqParam = (req: Request, key: string): string => {
  const value = req.params[key];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
};
