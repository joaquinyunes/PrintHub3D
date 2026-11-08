import request from 'supertest';
import { createApp } from '../src/app';
import Client from '../src/modules/clients/client.model';
import Order from '../src/modules/orders/order.model';
import AuditLog from '../src/modules/audit/audit.model';
import { bearer } from './helpers';

const app = createApp();
const T = 'priv_a';

const seed = async (tenant = T) => {
  const c: any = await Client.create({ name: 'Marta Gómez', email: 'marta@mail.test', phone: '+54 379 1234567', tenantId: tenant, totalSpent: 5000, orderCount: 1 });
  const o: any = await Order.create({ clientName: 'Marta Gómez', total: 5000, trackingCode: 'PRIV-' + Math.random().toString(36).slice(2, 7), tenantId: tenant, customerContact: '+54 379 1234567', notes: 'Entregar por la tarde', items: [{ productName: 'Taza', quantity: 1, price: 5000 }] });
  return { c, o };
};

describe('privacidad (Ley 25.326): exportar y suprimir datos de un cliente', () => {
  it('solo el admin; el personal y los clientes no', async () => {
    const { c } = await seed();
    expect((await request(app).get(`/api/clients/${c._id}/export`).set('Authorization', bearer('staff', T))).status).toBe(403);
    expect((await request(app).delete(`/api/clients/${c._id}/personal-data`).set('Authorization', bearer('client', T))).status).toBe(403);
  });

  it('exporta cliente + pedidos', async () => {
    const { c, o } = await seed();
    const res = await request(app).get(`/api/clients/${c._id}/export`).set('Authorization', bearer('admin', T));
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.body.client.email).toBe('marta@mail.test');
    expect(res.body.orders.map((x: any) => x._id)).toContain(String(o._id));
  });

  it('suprime los datos personales, conserva importes y deja registro sin el dato borrado', async () => {
    const { c, o } = await seed();
    const res = await request(app).delete(`/api/clients/${c._id}/personal-data`).set('Authorization', bearer('admin', T));
    expect(res.status).toBe(200);
    const client: any = await Client.findById(c._id).lean();
    expect(client).toMatchObject({ name: 'Cliente eliminado', totalSpent: 5000 });
    expect(client.email).toBeUndefined();
    expect(client.phone).toBeUndefined();
    const order: any = await Order.findById(o._id).lean();
    expect(order).toMatchObject({ clientName: 'Cliente eliminado', customerContact: '', notes: '', total: 5000 });
    const log = await AuditLog.findOne({ action: 'client.erase', target: String(c._id) }).lean();
    expect(JSON.stringify(log)).not.toContain('Marta');
  });

  it('no toca clientes de otro taller', async () => {
    const { c } = await seed('priv_b');
    expect((await request(app).get(`/api/clients/${c._id}/export`).set('Authorization', bearer('admin', T))).status).toBe(404);
    expect((await request(app).delete(`/api/clients/${c._id}/personal-data`).set('Authorization', bearer('admin', T))).status).toBe(404);
    expect((await Client.findById(c._id).lean() as any).email).toBe('marta@mail.test');
  });
});
