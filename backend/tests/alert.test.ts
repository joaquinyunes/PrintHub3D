import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middleware/errorHandler';
import { _resetAlertThrottle } from '../src/utils/alert';

const appWithBoom = () => {
  const app = express();
  app.get('/boom', () => { throw new Error('se rompió algo'); });
  app.get('/ok-error', (_req, _res, next) => next(Object.assign(new Error('no encontrado'), { statusCode: 404, isOperational: true })));
  app.use(errorHandler as never);
  return app;
};

describe('aviso de errores 500 (V7)', () => {
  const realFetch = global.fetch;
  let calls: { url: string; body: any }[];
  beforeEach(() => {
    calls = [];
    _resetAlertThrottle();
    process.env.ALERT_WEBHOOK_URL = 'https://alertas.example/hook';
    global.fetch = jest.fn(async (url: any, init: any) => { calls.push({ url: String(url), body: JSON.parse(init.body) }); return new Response('ok'); }) as any;
  });
  afterEach(() => { global.fetch = realFetch; delete process.env.ALERT_WEBHOOK_URL; });

  it('un 500 manda un aviso con método, ruta y mensaje', async () => {
    await request(appWithBoom()).get('/boom');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://alertas.example/hook');
    expect(calls[0].body).toMatchObject({ method: 'GET', path: '/boom', message: 'se rompió algo' });
    expect(calls[0].body.content).toContain('/boom');
  });

  it('el mismo error repetido no inunda: un aviso por minuto', async () => {
    const app = appWithBoom();
    await request(app).get('/boom');
    await request(app).get('/boom');
    await request(app).get('/boom');
    expect(calls).toHaveLength(1);
  });

  it('los errores 4xx no avisan, y sin ALERT_WEBHOOK_URL no se llama a nadie', async () => {
    await request(appWithBoom()).get('/ok-error');
    expect(calls).toHaveLength(0);
    delete process.env.ALERT_WEBHOOK_URL;
    await request(appWithBoom()).get('/boom');
    expect(calls).toHaveLength(0);
  });
});
