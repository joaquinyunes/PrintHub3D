import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { bearer } from './helpers';

const app = createApp();

describe('Autenticación y roles', () => {
  describe('sin token', () => {
    it.each([
      '/api/orders',
      '/api/settings',
      '/api/analytics/dashboard',
      '/api/expenses',
      '/api/users',
    ])('GET %s → 401', async (url) => {
      const res = await request(app).get(url);
      expect(res.status).toBe(401);
    });
  });

  it('un token firmado con otro secreto → 401', async () => {
    const forged = jwt.sign({ id: 'x', role: 'admin', tenantId: 't' }, 'otro-secreto');
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('un token vencido → 401', async () => {
    const expired = jwt.sign({ id: 'x', role: 'admin', tenantId: 't' }, process.env.JWT_SECRET as string, {
      expiresIn: -10,
    });
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  describe('rutas operativas (staff o admin)', () => {
    it('staff puede ver pedidos', async () => {
      const res = await request(app).get('/api/orders').set('Authorization', bearer('staff'));
      expect(res.status).toBe(200);
    });

    it('un cliente registrado NO puede ver pedidos', async () => {
      const res = await request(app).get('/api/orders').set('Authorization', bearer('client'));
      expect(res.status).toBe(403);
    });
  });

  describe('rutas de dueño (solo admin): caja, reportes y configuración', () => {
    it.each(['/api/settings', '/api/analytics/dashboard', '/api/expenses', '/api/users'])(
      'staff recibe 403 en GET %s',
      async (url) => {
        const res = await request(app).get(url).set('Authorization', bearer('staff'));
        expect(res.status).toBe(403);
      },
    );

    it.each(['/api/settings', '/api/expenses'])('admin accede a GET %s', async (url) => {
      const res = await request(app).get(url).set('Authorization', bearer('admin'));
      expect(res.status).toBe(200);
    });
  });

  it('la cookie httpOnly "token" también autentica', async () => {
    const token = bearer('admin').replace('Bearer ', '');
    const res = await request(app).get('/api/settings').set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });
});
