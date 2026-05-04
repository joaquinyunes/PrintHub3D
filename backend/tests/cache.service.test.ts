import { cacheService } from '../src/services/cache.service';

describe('Cache Service', () => {
  beforeEach(async () => {
    if (cacheService.client) {
      await cacheService.client.flushall();
    }
  });

  it('debería guardar y recuperar datos del caché', async () => {
    if (!cacheService.client) {
      console.warn('Redis no disponible, saltando test');
      return;
    }

    const key = 'test:key';
    const data = { id: 1, name: 'Test' };

    await cacheService.set(key, data, { ttl: 60 });
    const result = await cacheService.get<typeof data>(key);

    expect(result).toEqual(data);
  });

  it('debería retornar null para claves inexistentes', async () => {
    const result = await cacheService.get('nonexistent:key');
    expect(result).toBeNull();
  });

  it('debería construir claves con tenant', () => {
    const key = cacheService.buildKey('products', 'tenant1', 'list');
    expect(key).toBe('cache:products:tenant:tenant1:list');
  });
});
