import rateLimit from 'express-rate-limit';

// Limite general para API pública
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite estricto para rutas de autenticación (previene fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Solo 10 intentos por ventana en rutas de auth
  message: 'Demasiados intentos de autenticación. Por favor, intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
});

export default limiter;
