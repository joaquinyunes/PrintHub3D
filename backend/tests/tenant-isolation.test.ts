import request from 'supertest';
import { createApp } from '../src/app';
import Product from '../src/modules/products/product.model';
import Order from '../src/modules/orders/order.model';
import { OrderService } from '../src/modules/orders/order.service';
import { sanitizeValue } from '../src/middleware/sanitizeInput';
import { bearer } from './helpers';

const app = createApp();

const seedOrder = async (tenantId: string, clientName: string): Promise<any> => {
  const p: any = await Product.create({
    name: `Producto ${clientName}`,
    category: 'Vasos',
    price: 1000,
    cost: 300,
    stock: 50,
    tenantId,
  });
  return OrderService.createOrder({
    tenantId,
    clientName,
    items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: p.price }],
  });
};

describe('Aislamiento entre talleres (multi-tenant)', () => {
  it('cada usuario ve solo los pedidos de su tenant', async () => {
    await seedOrder('tenant_a', 'Cliente de A');
    await seedOrder('tenant_b', 'Cliente de B');

    const resA = await request(app).get('/api/orders').set('Authorization', bearer('admin', 'tenant_a'));
    expect(resA.status).toBe(200);
    expect(resA.body.items.map((o: any) => o.clientName)).toEqual(['Cliente de A']);

    const resB = await request(app).get('/api/orders').set('Authorization', bearer('admin', 'tenant_b'));
    expect(resB.body.items.map((o: any) => o.clientName)).toEqual(['Cliente de B']);
  });

  it('el header x-tenant-id NO permite leer datos de otro tenant', async () => {
    await seedOrder('tenant_a', 'Cliente de A');
    await seedOrder('tenant_b', 'Cliente de B');

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', bearer('admin', 'tenant_a'))
      .set('x-tenant-id', 'tenant_b');

    expect(res.body.items.map((o: any) => o.clientName)).toEqual(['Cliente de A']);
  });

  it('no se puede cambiar el estado de un pedido de otro tenant', async () => {
    const orderB = await seedOrder('tenant_b', 'Cliente de B');

    const res = await request(app)
      .put(`/api/orders/${orderB._id}/status`)
      .set('Authorization', bearer('admin', 'tenant_a'))
      .send({ status: 'cancelled' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    const fresh: any = await Order.findById(orderB._id);
    expect(fresh.status).not.toBe('cancelled');
  });
});

describe('sanitizeValue (anti inyección NoSQL)', () => {
  it('renombra claves con $ o . en cualquier nivel', () => {
    const out: any = sanitizeValue({ email: { $ne: null }, items: [{ 'a.b': 1 }], ok: 'x' });
    expect(out.email).toEqual({ __$ne: null });
    expect(out.items[0]).toEqual({ '__a.b': 1 });
    expect(out.ok).toBe('x');
  });
});
