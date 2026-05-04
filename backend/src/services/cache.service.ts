import Redis from 'ioredis';
import { appConfig } from '../config';

type RedisClient = Redis | null;

let redisClient: RedisClient = null;

if (appConfig.redisUrl) {
  redisClient = new Redis(appConfig.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis conectado para caché');
  });
}

export interface CacheOptions {
  ttl?: number;
  tenantAware?: boolean;
}

const defaultOptions: CacheOptions = {
  ttl: 300,
  tenantAware: true,
};

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, options: CacheOptions = defaultOptions): Promise<void> {
    if (!redisClient) return;
    try {
      const ttl = options.ttl || defaultOptions.ttl;
      await redisClient.setex(key, ttl!, JSON.stringify(value));
    } catch {
      // Silently fail - cache is optional
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch {
      // Silently fail
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {
      // Silently fail
    }
  },

  buildKey(prefix: string, tenantId?: string, ...parts: string[]): string {
    const tenantPart = tenantId ? `:tenant:${tenantId}` : '';
    return `cache:${prefix}${tenantPart}:${parts.join(':')}`;
  },

  get client(): RedisClient {
    return redisClient;
  },
};

export default cacheService;
