import request from 'supertest';
import { createApp } from '../src/app';
import { costQuote } from '../src/modules/quotes/quote.cost';
import { estimateQuote } from '../src/modules/quotes/quote.pricing';
import { bearer } from './helpers';

// Dinero: cada caso tiene su resultado esperado calculado aparte (planilla del taller para la
// calculadora de costo; cuenta hecha por separado con las tarifas de quote.pricing para el estimador).
const sheet = { filamentPrice: 21000, kwhPrice: 140, watts: 100, lifeHours: 3000, spareParts: 150000, errorPct: 5, mlSurcharge: 0.8 };

describe('calculadora de costo (planilla del taller)', () => {
  it('fila "Portallaves grande"', () => {
    expect(costQuote(sheet, { hours: 10, minutes: 0, grams: 400, extras: 4000 }, 4)).toEqual({
      material: 8400, power: 140, wear: 500, error: 452, cost: 9492, extras: 5200, total: 43168, mercadoLibre: 50761.6,
    });
  });

  it('fila "bases x 4 trofeo" (suma los minutos)', () => {
    const q = costQuote(sheet, { hours: 6, minutes: 16, grams: 254, extras: 0 }, 4);
    expect(q.power).toBe(87.73);
    expect(q.total).toBe(24087.28);
    expect(q.mercadoLibre).toBe(28904.74);
  });

  it('captura de referencia (filamento 16.000, repuestos 50.000, ×3,5)', () => {
    const q = costQuote({ ...sheet, filamentPrice: 16000, spareParts: 50000 }, { hours: 10, minutes: 0, grams: 400, extras: 0 }, 3.5);
    expect(q.cost).toBe(7042);
    expect(q.total).toBe(24647);
  });

  it('vida útil 0 no divide por cero', () => {
    expect(costQuote({ ...sheet, lifeHours: 0 }, { hours: 1, minutes: 0, grams: 0, extras: 0 }, 2).wear).toBe(0);
  });

  it('entradas inválidas (negativas, NaN) cuentan como 0: nunca precio negativo ni NaN', () => {
    const q = costQuote(sheet, { hours: -5, minutes: NaN, grams: -100, extras: -50 }, 4);
    expect(q).toEqual({ material: 0, power: 0, wear: 0, error: 0, cost: 0, extras: 0, total: 0, mercadoLibre: 0 });
  });
});

describe('estimador público (quote.pricing): resultados esperados fijos', () => {
  const mk = (material: string, x: number, y: number, z: number, solidity: string, infill: number, quantity: number, finish = 'estandar', rush = false) =>
    estimateQuote({ material, dimensionsMm: { x, y, z }, solidity, infill, quantity, finish, rush });

  it.each([
    ['base PLA 80×80×60', mk('PLA', 80, 80, 60, 'normal', 20, 1), { weightGrams: 138, printHours: 10.6, materialCost: 3038, machineCost: 15933, laborCost: 3300, unitPrice: 43500, total: 47000 }],
    ['mínimo: pieza diminuta cae al precio mínimo', mk('PLA', 10, 10, 10, 'hueco', 0, 1), { weightGrams: 1, printHours: 0.1, materialCost: 22, machineCost: 115, laborCost: 3300, unitPrice: 3000, total: 6500 }],
    ['TPU sólida premium urgente ×3', mk('TPU', 50, 40, 30, 'solido', 50, 3, 'premium', true), { weightGrams: 49, printHours: 3.8, materialCost: 1862, machineCost: 5654, laborCost: 4900, unitPrice: 32500, total: 102500 }],
    ['resina ×10 piezas chicas', mk('RESINA', 30, 30, 30, 'normal', 20, 10), { weightGrams: 9, printHours: 0.7, materialCost: 388, machineCost: 994, laborCost: 10500, unitPrice: 3000, total: 40500 }],
    ['PETG sólido 100% relleno ×2', mk('PETG', 100, 60, 40, 'solido', 100, 2), { weightGrams: 244, printHours: 18.8, materialCost: 6340, machineCost: 28135, laborCost: 4100, unitPrice: 79500, total: 163000 }],
  ])('%s', (_name, got, expected) => {
    expect(got).toEqual(expected);
  });

  it('material desconocido usa PLA y cantidad 0 cuenta como 1', () => {
    expect(mk('NYLON', 80, 80, 60, 'normal', 20, 0)).toEqual(mk('PLA', 80, 80, 60, 'normal', 20, 1));
  });
});

describe('API de cotización', () => {
  const app = createApp();
  const body = { material: 'PLA', dimensionsMm: { x: 80, y: 80, z: 60 }, solidity: 'normal', quantity: 1, finish: 'estandar', rush: false };

  it('relleno 0 % se respeta (antes se tomaba como 20 %)', async () => {
    const zero = await request(app).post('/api/quotes/estimate').send({ ...body, infill: 0 });
    const twenty = await request(app).post('/api/quotes/estimate').send({ ...body, infill: 20 });
    const missing = await request(app).post('/api/quotes/estimate').send(body);
    // materialFraction: 0,24 + 0 · 0,25 = 0,24 → 384 cm³ · 1,24 · 0,24 = 114,3 g ; con 20 % = 138,1 g
    expect(zero.body.estimate.weightGrams).toBe(114);
    expect(twenty.body.estimate.weightGrams).toBe(138);
    expect(missing.body.estimate.weightGrams).toBe(138);
  });

  it('POST /cost: requiere sesión de staff/admin y valida el borde', async () => {
    const payload = { settings: sheet, piece: { hours: 10, minutes: 0, grams: 400, extras: 4000 }, multiplier: 4 };
    expect((await request(app).post('/api/quotes/cost').send(payload)).status).toBe(401);
    expect((await request(app).post('/api/quotes/cost').set('Authorization', bearer('client')).send(payload)).status).toBe(403);
    const ok = await request(app).post('/api/quotes/cost').set('Authorization', bearer('staff')).send(payload);
    expect(ok.status).toBe(200);
    expect(ok.body.quote.total).toBe(43168);
    const bad = await request(app).post('/api/quotes/cost').set('Authorization', bearer('staff')).send({ ...payload, multiplier: -1 });
    expect(bad.status).toBe(400);
    const nosql = await request(app).post('/api/quotes/cost').set('Authorization', bearer('staff')).send({ ...payload, piece: { ...payload.piece, grams: { $gt: 0 } } });
    expect(nosql.status).toBe(400);
  });
});
