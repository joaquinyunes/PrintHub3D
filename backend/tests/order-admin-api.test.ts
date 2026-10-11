import request from 'supertest';
import { createApp } from '../src/app';
import Product from '../src/modules/products/product.model';
import Order from '../src/modules/orders/order.model';
import { bearer } from './helpers';

const app = createApp();
const TENANT = 'tenant_a';
const auth = () => bearer('staff', TENANT);

const makeProduct = (): Promise<any> =>
  Product.create({ name: 'Vaso River', category: 'Vasos', price: 3500, cost: 900, stock: 20, tenantId: TENANT });

describe('API de pedidos del panel', () => {
  it('guarda el link del chat al crear el pedido', async () => {
    const p = await makeProduct();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', auth())
      .send({
        clientName: 'Cliente Chat',
        chatLink: 'https://wa.me/549379400000',
        items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: p.price }],
      });

    expect(res.status).toBe(201);
    expect(res.body.chatLink).toBe('https://wa.me/549379400000');
  });

  it('editar un pedido conserva el progreso de impresión y actualiza el chat', async () => {
    const p = await makeProduct();
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', auth())
      .send({
        clientName: 'Cliente',
        items: [{ productId: String(p._id), productName: p.name, quantity: 4, price: p.price }],
      });
    const id = created.body._id;

    // El operario marcó piezas impresas (el endpoint real lo hace por ítem; acá lo fijamos directo).
    await Order.updateOne({ _id: id }, { $set: { 'items.0.printedQuantity': 4 } });
    const current: any = await Order.findById(id).lean();

    const res = await request(app)
      .put(`/api/orders/${id}`)
      .set('Authorization', auth())
      .send({
        clientName: 'Cliente',
        chatLink: 'https://wa.me/1',
        items: current.items.map((i: any) => ({
          productId: String(i.productId),
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          printedQuantity: i.printedQuantity,
        })),
      });

    expect(res.status).toBe(200);
    expect(res.body.chatLink).toBe('https://wa.me/1');
    expect(res.body.items[0].printedQuantity).toBe(4);
  });

  it('un cliente anónimo no puede crear pedidos por la ruta del panel', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ clientName: 'Anon', items: [{ productName: 'X', quantity: 1, price: 1, isCustom: true }] });
    expect(res.status).toBe(401);
  });
});
