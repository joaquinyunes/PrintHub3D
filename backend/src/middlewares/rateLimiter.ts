import rateLimit from 'express-rate-limit';

// Limite general para API pública
export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: Number(process.env.RATE_LIMIT_MAX || 150), // requests por ventana
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

// Límite estricto para rutas de pagos (previene spam en MercadoPago)
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos por IP por ventana
  message: 'Demasiadas solicitudes de pago. Por favor, intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Escrituras públicas (pedidos de la tienda, cotizaciones, opiniones): tope por IP contra spam y relleno de la base.
export const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.PUBLIC_WRITE_LIMIT || 20),
  message: { message: 'Demasiadas solicitudes desde esta red. Probá de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhooks (Mercado Pago): holgado para no cortar reintentos legítimos, pero acota un flood.
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// PIN de operarios: además del bloqueo por operario (5 fallos = 15 min), tope por IP.
export const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Demasiados intentos de PIN desde esta red. Probá en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export default limiter;
