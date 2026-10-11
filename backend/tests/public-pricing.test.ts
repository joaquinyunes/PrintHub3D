import request from 'supertest';
import { createApp } from '../src/app';
import { appConfig } from '../src/config';
import Product from '../src/modules/products/product.model';
import Order from '../src/modules/orders/order.model';
import { MercadoPagoService } from '../src/modules/payments/mercadopago.service';

const app = createApp();
const TENANT = appConfig.defaultTenantId;

const makeProduct = (over: Record<string, unknown> = {}): Promise<any> =>
  Product.create({
    name: 'Lámpara Luna',
    category: 'Lámparas',
    price: 5000,
    cost: 1500,
    stock: 20,
    tenantId: TENANT,
    ...over,
  });

describe('Precios en pedidos de visitantes anónimos', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('POST /api/orders/public', () => {
    it('ignora el precio y el flag isCustom que manda el cliente', async () => {
      const p = await makeProduct();

      const res = await request(app)
        .post('/api/orders/public')
        .send({
          clientName: 'Atacante',
          items: [{ productId: String(p._id), productName: p.name, quantity: 2, price: 1, isCustom: true }],
        });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(10000);
      expect(res.body.items[0].price).toBe(5000);
      expect(res.body.items[0].isCustom).toBe(false);
      expect(res.body.whatsappUrl).toContain('wa.me');
    });

    it('rechaza ítems sin productId (precio inventado)', async () => {
      const res = await request(app)
        .post('/api/orders/public')
        .send({ clientName: 'Atacante', items: [{ productName: 'Algo', quantity: 1, price: 1 }] });

      expect(res.status).toBe(400);
      expect(await Order.countDocuments({})).toBe(0);
    });
  });

  describe('POST /api/payments/create-preference (checkout web)', () => {
    it('cobra el precio del catálogo aunque el body diga otro', async () => {
      const p = await makeProduct();
      const createPreference = jest
        .spyOn(MercadoPagoService, 'createPreference')
        .mockResolvedValue({ id: 'pref-1', initPoint: 'https://mp/pay', sandboxInitPoint: 'https://mp/sandbox' } as any);

      const res = await request(app)
        .post('/api/payments/create-preference')
        .send({
          clientName: 'Atacante',
          items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: 1, isCustom: true }],
        });

      expect(res.status).toBe(200);
      const args = createPreference.mock.calls[0][0];
      expect(args.items).toEqual([{ title: p.name, quantity: 1, unitPrice: 5000 }]);
    });

    it('una cantidad negativa se normaliza a 1 y no genera total negativo', async () => {
      const p = await makeProduct();
      jest
        .spyOn(MercadoPagoService, 'createPreference')
        .mockResolvedValue({ id: 'pref-1', initPoint: 'x', sandboxInitPoint: 'y' } as any);

      const res = await request(app)
        .post('/api/payments/create-preference')
        .send({ clientName: 'Atacante', items: [{ productId: String(p._id), productName: p.name, quantity: -5 }] });

      expect(res.status).toBe(200);
      const order: any = await Order.findOne({});
      expect(order.total).toBe(5000);
    });

    it('rechaza productos que no existen en el catálogo', async () => {
      const res = await request(app)
        .post('/api/payments/create-preference')
        .send({
          clientName: 'Atacante',
          items: [{ productId: '64b0000000000000000000aa', productName: 'Fantasma', quantity: 1, price: 1 }],
        });

      expect(res.status).toBe(409);
    });
  });
});
