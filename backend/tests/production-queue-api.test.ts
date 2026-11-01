import request from 'supertest';
import { createApp } from '../src/app';
import Order from '../src/modules/orders/order.model';
import Piece from '../src/modules/production/piece.model';
import { bearer } from './helpers';

const app = createApp();
const A = 'tenant_a';
const B = 'tenant_b';

const makeOrder = (tenantId: string, clientName: string, dueDate: string, trackingCode: string) =>
  Order.create({
    clientName, total: 1000, trackingCode, tenantId, dueDate: new Date(`${dueDate}T12:00:00Z`),
    items: [{ productName: 'Dragón articulado', quantity: 2, price: 500 }, { productName: 'Llavero', quantity: 1, price: 0 }],
  }) as Promise<any>;

const generate = (orderId: string, tenant: string, body: object = {}) =>
  request(app).post(`/api/production-queue/orders/${orderId}/pieces`).set('Authorization', bearer('staff', tenant)).send(body);

describe('cola de producción por piezas', () => {
  it('genera piezas por ítem (con partes y color) y arma la cola por color', async () => {
    const o = await makeOrder(A, 'Ana', '2026-11-05', 'PQ-1');
    const res = await generate(o._id, A, { items: [{ itemIndex: 0, parts: [{ label: 'Cabeza', color: 'Rojo', quantity: 1 }, { label: 'Cuerpo', color: 'Negro', quantity: 2 }] }] });
    expect(res.status).toBe(201);
    // ítem 0 → 2 piezas (×2 unidades); ítem 1 sin partes → 1 pieza con su nombre
    expect(res.body.map((x: any) => [x.label, x.quantityTotal])).toEqual([['Cabeza', 2], ['Cuerpo', 4], ['Llavero', 1]]);

    const queue = await request(app).get('/api/production-queue/queue?group=color').set('Authorization', bearer('staff', A));
    expect(queue.status).toBe(200);
    const labels = queue.body.groups.map((g: any) => g.label);
    expect(labels).toEqual(expect.arrayContaining(['Rojo', 'Negro', 'Sin color']));
    expect(queue.body.groups[0].entries[0].due.label).toBeDefined();
  });

  it('no genera piezas dos veces para el mismo pedido', async () => {
    const o = await makeOrder(A, 'Beto', '2026-11-06', 'PQ-2');
    expect((await generate(o._id, A)).status).toBe(201);
    expect((await generate(o._id, A)).status).toBe(409);
  });

  it('avanzar una pieza recorre pendiente → imprimiendo → hecha → pendiente y ajusta lo hecho', async () => {
    const o = await makeOrder(A, 'Caro', '2026-11-07', 'PQ-3');
    const [piece] = (await generate(o._id, A)).body;
    const adv = () => request(app).patch(`/api/production-queue/pieces/${piece._id}/advance`).set('Authorization', bearer('staff', A));
    expect((await adv()).body).toMatchObject({ status: 'printing', quantityDone: 0 });
    expect((await adv()).body).toMatchObject({ status: 'done', quantityDone: piece.quantityTotal });
    expect((await adv()).body).toMatchObject({ status: 'pending', quantityDone: 0 });
  });

  it('las piezas hechas salen de la cola', async () => {
    const o = await makeOrder(A, 'Dani', '2026-11-08', 'PQ-4');
    const pieces = (await generate(o._id, A)).body;
    await Piece.updateMany({ orderId: o._id }, { $set: { status: 'done' } });
    const queue = await request(app).get('/api/production-queue/queue?group=customer').set('Authorization', bearer('staff', A));
    const ids = queue.body.groups.flatMap((g: any) => g.entries.map((e: any) => e._id));
    for (const p of pieces) expect(ids).not.toContain(p._id);
  });

  it('un taller no ve ni toca las piezas de otro', async () => {
    const o = await makeOrder(A, 'Eli', '2026-11-09', 'PQ-5');
    const [piece] = (await generate(o._id, A)).body;
    const other = await request(app).patch(`/api/production-queue/pieces/${piece._id}/advance`).set('Authorization', bearer('staff', B));
    expect(other.status).toBe(404);
    const queue = await request(app).get('/api/production-queue/queue').set('Authorization', bearer('staff', B));
    expect(queue.body.groups).toEqual([]);
    expect((await generate(o._id, B)).status).toBe(404);
  });

  it('un cliente no entra a la cola', async () => {
    const res = await request(app).get('/api/production-queue/queue').set('Authorization', bearer('client', A));
    expect([401, 403]).toContain(res.status);
  });
});
