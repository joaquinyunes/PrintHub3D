import dotenv from 'dotenv';

dotenv.config();

type NodeEnv = 'development' | 'test' | 'production';

const NODE_ENV: NodeEnv =
  (process.env.NODE_ENV as NodeEnv) || 'development';

const isProduction = NODE_ENV === 'production';

const getMongoUri = (): string => {
  const fromEnv = process.env.MONGO_URI?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (!isProduction) {
    // Solo permitimos default en desarrollo/test
    return 'mongodb://localhost:27017/global3d';
  }

  throw new Error('MONGO_URI is required in production');
};

const getJwtSecret = (): string => {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (!isProduction) {
    // Default inseguro solo para desarrollo
    return 'dev-change-me-jwt-secret';
  }

  throw new Error('JWT_SECRET is required in production');
};

const getDefaultTenantId = (): string => {
  const fromEnv = process.env.DEFAULT_TENANT_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (!isProduction) {
    // Mantiene compatibilidad, pero ya no está hardcodeado en todo el código
    return 'global3d_hq';
  }

  throw new Error('DEFAULT_TENANT_ID is required in production');
};

const getRedisUrl = (): string | undefined => {
  const fromEnv = process.env.REDIS_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (!isProduction) {
    return 'redis://localhost:6379';
  }

  // En producción lo dejamos undefined para que los workers fallen rápido si la cola es obligatoria
  return undefined;
};

const getOrderApiBaseUrl = (): string | undefined => {
  const fromEnv = process.env.ORDER_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  if (!isProduction) {
    return 'http://localhost:5000/api';
  }

  // En producción, si el bot depende de esto, se debe configurar explícitamente
  return undefined;
};

export const appConfig = {
  nodeEnv: NODE_ENV,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: getMongoUri(),
  jwtSecret: getJwtSecret(),
  defaultTenantId: getDefaultTenantId(),
  redisUrl: getRedisUrl(),
  whatsapp: {
    orderApiBaseUrl: getOrderApiBaseUrl(),
  },
};

export type AppConfig = typeof appConfig;

