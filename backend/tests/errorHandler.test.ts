import { z } from 'zod';
import { errorHandler } from '../src/middleware/errorHandler';
import express from 'express';
import request from 'supertest';

describe('Error Handler - ZodError', () => {
  it('debería manejar errores de validación de Zod correctamente', async () => {
    const app = express();
    app.use(express.json());

    const testSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    });

    app.post('/test-validation', async (req, res, next) => {
      try {
        await testSchema.parseAsync(req.body);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    });

    app.use(errorHandler as any);

    const response = await request(app)
      .post('/test-validation')
      .send({ name: 'Jo', email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Error de validación');
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('debería manejar errores internos correctamente', async () => {
    const app = express();
    app.use(express.json());

    app.get('/test-error', (req, res, next) => {
      const error: any = new Error('Test error');
      error.statusCode = 500;
      error.isOperational = true;
      next(error);
    });

    app.use(errorHandler as any);

    const response = await request(app).get('/test-error');

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Test error');
  });
});
