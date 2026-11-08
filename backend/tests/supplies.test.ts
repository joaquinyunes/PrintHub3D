import request from 'supertest';
import { createApp } from '../src/app';
import Supply from '../src/modules/supplies/supply.model';
import { parseAmount, planSync, setSheetsSourceForTests } from '../src/modules/supplies/supply.sync';
import { bearer } from './helpers';

const app = createApp();
const T = 'sup_a';

describe('parseAmount y planSync (puros)', () => {
  it('lee números argentinos y rechaza basura', () => {
    expect([parseAmount('12'), parseAmount('3,5'), parseAmount('1.200'), parseAmount('1.200,5'), parseAmount(' 7 ')]).toEqual([12, 3.5, 1200, 1200.5, 7]);
    for (const bad of ['', 'abc', '-3', '1,2,3', '12kg']) expect(parseAmount(bad)).toBeNaN();
  });

  const existing = [{ _id: 'a', nameKey: 'iman', name: 'Imán', unit: 'unidades', stock: 10, minStock: 2 }];
  it('crea, actualiza, deja igual y marca filas inválidas con su número', () => {
    const plan = planSync(existing, [
      ['INSUMO', 'UNIDAD', 'STOCK', 'MÍNIMO'],
      ['iman ', 'unidades', '15', '2'], // actualiza stock (clave normalizada: "iman " = "Imán")
      ['Argolla', 'unidades', '1.000', '100'], // crea
      ['', 'u', '5', '1'], // nombre vacío
      ['Caja', 'u', 'muchas', '1'], // stock inválido
      ['argolla', 'u', '3', '1'], // repetido
      [],
    ]);
    expect(plan.create).toEqual([{ name: 'Argolla', unit: 'unidades', stock: 1000, minStock: 100 }]);
    expect(plan.update).toHaveLength(1);
    expect(plan.update[0].changes).toEqual({ stock: { from: 10, to: 15 } });
    expect(plan.invalid.map((i) => i.row)).toEqual([4, 5, 6]);
    expect(plan.unchanged).toBe(0);
  });

  it('una fila igual a la base cuenta como sin cambios', () => {
    expect(planSync(existing, [['Imán', 'unidades', '10', '2']])).toMatchObject({ unchanged: 1, create: [], update: [] });
  });
});

describe('API de insumos', () => {
  it('alta solo admin; el personal lista y ajusta; no se repite el nombre (sin importar tildes)', async () => {
    expect((await request(app).post('/api/supplies').set('Authorization', bearer('staff', T)).send({ name: 'Imán' })).status).toBe(403);
    const ok = await request(app).post('/api/supplies').set('Authorization', bearer('admin', T)).send({ name: 'Imán', stock: 10, minStock: 12 });
    expect(ok.status).toBe(201);
    expect((await request(app).post('/api/supplies').set('Authorization', bearer('admin', T)).send({ name: ' iman ' })).status).toBe(409);
    const list = await request(app).get('/api/supplies').set('Authorization', bearer('staff', T));
    expect(list.body.items[0]).toMatchObject({ name: 'Imán', stock: 10, low: true });
  });

  it('el ajuste nunca deja el stock negativo y queda en la auditoría; otro taller no lo ve', async () => {
    const s: any = (await request(app).post('/api/supplies').set('Authorization', bearer('admin', T)).send({ name: 'Lija', stock: 5 })).body;
    const adj = (delta: number, tenant = T) => request(app).post(`/api/supplies/${s._id}/adjust`).set('Authorization', bearer('staff', tenant)).send({ delta });
    expect((await adj(-3)).body.stock).toBe(2);
    expect((await adj(-3)).status).toBe(409);
    expect((await Supply.findById(s._id).lean() as any).stock).toBe(2);
    expect((await adj(0)).status).toBe(400);
    expect((await adj(-1, 'sup_b')).status).toBe(404);
  });

  it('sync: 501 sin configuración; con una planilla de prueba informa y recién aplica con apply:true; filas malas no rompen el resto', async () => {
    setSheetsSourceForTests(null);
    expect((await request(app).post('/api/supplies/sync').set('Authorization', bearer('admin', T)).send({})).status).toBe(501);
    expect((await request(app).post('/api/supplies/sync').set('Authorization', bearer('staff', T)).send({})).status).toBe(403);

    setSheetsSourceForTests({ readRows: async () => [['INSUMO', 'UNIDAD', 'STOCK', 'MÍNIMO'], ['Cinta', 'rollos', '8', '2'], ['Rota', 'u', 'x', '1']] });
    const dry = await request(app).post('/api/supplies/sync').set('Authorization', bearer('admin', 'sup_c')).send({});
    expect(dry.body).toMatchObject({ applied: false, plan: { create: [{ name: 'Cinta' }], invalid: [{ row: 3 }] } });
    expect(await Supply.countDocuments({ tenantId: 'sup_c' })).toBe(0);

    const real = await request(app).post('/api/supplies/sync').set('Authorization', bearer('admin', 'sup_c')).send({ apply: true });
    expect(real.body.applied).toBe(true);
    expect(await Supply.countDocuments({ tenantId: 'sup_c' })).toBe(1);

    setSheetsSourceForTests({ readRows: async () => { throw new Error('403 de Google'); } });
    expect((await request(app).post('/api/supplies/sync').set('Authorization', bearer('admin', 'sup_c')).send({})).status).toBe(502);
    setSheetsSourceForTests(undefined);
  });
});
