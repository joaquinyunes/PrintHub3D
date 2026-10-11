import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app';
import { appConfig } from '../src/config';
import Product from '../src/modules/products/product.model';
import Order from '../src/modules/orders/order.model';
import Sale from '../src/modules/sales/sale.model';
import { OrderService } from '../src/modules/orders/order.service';
import { MercadoPagoService } from '../src/modules/payments/mercadopago.service';

const app = createApp();
const SECRET = 'mp-test-secret';
const PAYMENT_ID = '123456789';

const sign = (dataId: string, requestId = 'req-1', ts = String(Date.now())) => {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex');
  return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId };
};

const createOrder = async (): Promise<any> => {
  const p: any = await Product.create({
    name: 'Mate Groot',
    category: 'Mates',
    price: 8000,
    cost: 2000,
    stock: 10,
    tenantId: 'tenant_a',
  });
  return OrderService.createOrder({
    tenantId: 'tenant_a',
    clientName: 'Compradora Web',
    origin: 'Web',
    items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: p.price }],
  });
};

const postWebhook = (headers: Record<string, string>, id = PAYMENT_ID) =>
  request(app)
    .post(`/api/payments/webhook?type=payment&data.id=${id}`)
    .set(headers)
    .send({ type: 'payment', data: { id } });

const mockPayment = (order: any, over: Record<string, unknown> = {}) =>
  jest.spyOn(MercadoPagoService, 'getPayment').mockResolvedValue({
    status: 'approved',
    external_reference: String(order._id),
    transaction_amount: 8000,
    metadata: {},
    ...over,
  } as any);

describe('Webhook de MercadoPago', () => {
  const originalSecret = appConfig.mercadoPago.webhookSecret;

  beforeAll(() => {
    appConfig.mercadoPago.webhookSecret = SECRET;
  });
  afterAll(() => {
    appConfig.mercadoPago.webhookSecret = originalSecret;
  });
  afterEach(() => jest.restoreAllMocks());

  it('rechaza el webhook sin firma', async () => {
    const getPayment = jest.spyOn(MercadoPagoService, 'getPayment');
    const res = await postWebhook({});
    expect(res.status).toBe(401);
    expect(getPayment).not.toHaveBeenCalled();
  });

  it('rechaza una firma falsificada', async () => {
    const getPayment = jest.spyOn(MercadoPagoService, 'getPayment');
    const res = await postWebhook({ 'x-signature': `ts=1,v1=${'a'.repeat(64)}`, 'x-request-id': 'req-1' });
    expect(res.status).toBe(401);
    expect(getPayment).not.toHaveBeenCalled();
  });

  it('pago aprobado: acredita el pago y registra UNA venta', async () => {
    const order = await createOrder();
    mockPayment(order);

    const res = await postWebhook(sign(PAYMENT_ID));
    expect(res.status).toBe(200);

    const fresh: any = await Order.findById(order._id);
    expect(fresh.deposit).toBe(8000);
    expect(fresh.paymentMethod).toBe('MercadoPago');
    expect(fresh.isSaleRegistered).toBe(true);
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(1);
  });

  it('MercadoPago reintenta: un webhook duplicado no duplica la venta', async () => {
    const order = await createOrder();
    mockPayment(order);

    await postWebhook(sign(PAYMENT_ID));
    await postWebhook(sign(PAYMENT_ID, 'req-2'));

    expect(await Sale.countDocuments({ orderId: order._id })).toBe(1);
  });

  it('pago de saldo: acumula sobre lo ya abonado y nunca supera el total', async () => {
    const order = await createOrder();
    await Order.updateOne({ _id: order._id }, { deposit: 4000 });
    mockPayment(order, { transaction_amount: 9999, metadata: { balance: true } });

    await postWebhook(sign(PAYMENT_ID));

    const fresh: any = await Order.findById(order._id);
    expect(fresh.deposit).toBe(fresh.total);
  });

  it('pago rechazado: no registra venta ni acredita nada', async () => {
    const order = await createOrder();
    mockPayment(order, { status: 'rejected' });

    const res = await postWebhook(sign(PAYMENT_ID));
    expect(res.status).toBe(200);
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(0);
    const fresh: any = await Order.findById(order._id);
    expect(fresh.deposit || 0).toBe(0);
  });
});
