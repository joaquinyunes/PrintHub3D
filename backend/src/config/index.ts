import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

type NodeEnv = 'development' | 'test' | 'production';

const NODE_ENV: NodeEnv =
  (process.env.NODE_ENV as NodeEnv) || 'development';

const isProduction = NODE_ENV === 'production';

// Validación estricta de variables críticas
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    logger.fatal(`Falta la variable de entorno crítica: ${varName}`);
    if (isProduction) process.exit(1);
  }
});

const getMongoUri = (): string => {
  return process.env.MONGO_URI?.trim() || 'mongodb://localhost:27017/global3d';
};

const getJwtSecret = (): string => {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;
  
  if (!isProduction) {
    logger.warn('JWT_SECRET no configurado. Usando fallback inseguro para desarrollo.');
    return 'dev-fallback-jwt-secret';
  }
  throw new Error('JWT_SECRET is required in production');
};

const getCorsOrigins = (): string[] => {
  const origins = process.env.CLIENT_URL || 'http://localhost:3000';
  return origins.split(',').map(o => o.trim());
};

const getClientUrl = (): string => {
  return (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();
};

const getApiPublicUrl = (): string => {
  return (
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.API_URL?.trim() ||
    `http://localhost:${Number(process.env.PORT || 5000)}`
  );
};

const getDefaultTenantId = (): string => {
  return process.env.DEFAULT_TENANT_ID?.trim() || 'global3d_hq';
};

export const appConfig = {
  nodeEnv: NODE_ENV,
  isProduction,
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '30d',
  cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  port: Number(process.env.PORT || 5000),
  mongoUri: getMongoUri(),
  jwtSecret: getJwtSecret(),
  defaultTenantId: getDefaultTenantId(),
  corsOrigins: getCorsOrigins(),
  clientUrl: getClientUrl(),
  apiPublicUrl: getApiPublicUrl(),
  logLevel: process.env.LOG_LEVEL || 'info',
  redisUrl: process.env.REDIS_URL?.trim(),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
  },
  mercadoPago: {
    accessToken: process.env.MP_ACCESS_TOKEN?.trim() || '',
    webhookSecret: process.env.MP_WEBHOOK_SECRET?.trim() || '',
  },
  whatsapp: {
    orderApiBaseUrl: process.env.ORDER_API_BASE_URL?.trim() || 'http://localhost:5000/api',
    twilioSid: process.env.TWILIO_ACCOUNT_SID?.trim() || '',
    twilioToken: process.env.TWILIO_AUTH_TOKEN?.trim() || '',
    twilioFrom: process.env.TWILIO_WHATSAPP_FROM?.trim() || '',
    adminNumber: process.env.ADMIN_WHATSAPP?.trim() || '',
  },
};

export type AppConfig = typeof appConfig;
