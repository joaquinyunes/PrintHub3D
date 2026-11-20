import crypto from 'crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { appConfig } from '../src/config';
import User from '../src/modules/auth/user.model';
import Product from '../src/modules/products/product.model';
import Order from '../src/modules/orders/order.model';
import Sale from '../src/modules/sales/sale.model';
import { OrderService } from '../src/modules/orders/order.service';
import { MercadoPagoService } from '../src/modules/payments/mercadopago.service';
import { bearer, tokenFor } from './helpers';

// Revisión adversaria de nuestro propio código: cada prueba es un ataque o una carrera concreta.
const app = createApp();
const T = 'adv_a';
const SECRET = 'mp-adv-secret';
const GOOD_ORIGIN = appConfig.corsOrigins[0];
const EVIL_ORIGIN = 'https://sitio-malo.example';

const sign = (dataId: string, requestId = 'req-1') => {
  const ts = String(Date.now());
  const v1 = crypto.createHmac('sha256', SECRET).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId };
};
const hook = (id: string, reqId = 'r1') => request(app).post(`/api/payments/webhook?type=payment&data.id=${id}`).set(sign(id, reqId)).send({ type: 'payment', data: { id } });
// La tienda pública vende siempre del taller por defecto (global3d_hq): ahí hay que crear los productos de esas pruebas.
const PUBLIC_TENANT = 'global3d_hq';
const mkProduct = (stock = 10, extra: object = {}) => Product.create({ name: 'Mate', category: 'Mates', price: 8000, cost: 2000, stock, tenantId: T, isPublic: true, ...extra }) as Promise<any>;
const mkOrder = async (total = 8000): Promise<any> => {
  const p = await mkProduct(10);
  const o: any = await OrderService.createOrder({ tenantId: T, clientName: 'Cli', origin: 'Web', items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: p.price }] });
  expect(o.total).toBe(total);
  return o;
};
const payment = (order: any, over: Record<string, unknown>) =>
  jest.spyOn(MercadoPagoService, 'getPayment').mockResolvedValue({ status: 'approved', external_reference: String(order._id), transaction_amount: 8000, metadata: {}, ...over } as any);

describe('CSRF: sesión por cookie desde otro sitio', () => {
  it('con cookie y Origin ajeno, una escritura se rechaza; con el Origin propio o con Bearer sigue andando', async () => {
    const user: any = await User.create({ name: 'Adm', email: 'csrf@adv.test', password: await bcrypt.hash('x', 4), role: 'admin', tenantId: T, verified: true });
    const token = jwtFor(user);
    const post = (origin?: string, cookie = true) => {
      const r = request(app).post('/api/auth/logout-all');
      if (cookie) r.set('Cookie', `token=${token}`); else r.set('Authorization', `Bearer ${token}`);
      return origin ? r.set('Origin', origin) : r;
    };
    expect((await post(EVIL_ORIGIN)).status).toBe(403);
    // Referer ajeno (sin Origin) tampoco
    const viaReferer = await request(app).post('/api/auth/logout-all').set('Cookie', `token=${token}`).set('Referer', `${EVIL_ORIGIN}/ataque.html`);
    expect(viaReferer.status).toBe(403);
    // el logout-all anterior no corrió: el token sigue valiendo
    expect((await post(GOOD_ORIGIN)).status).toBe(200);
  });

  it('Bearer con Origin ajeno no es CSRF (el navegador no adjunta Authorization solo)', async () => {
    const user: any = await User.create({ name: 'Adm2', email: 'csrf2@adv.test', password: await bcrypt.hash('x', 4), role: 'admin', tenantId: T, verified: true });
    const res = await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${jwtFor(user)}`).set('Origin', EVIL_ORIGIN);
    expect(res.status).toBe(200);
  });

  it('el webhook de pagos (sin cookie) no se ve afectado por la guarda', async () => {
    const res = await request(app).post('/api/payments/webhook?type=payment&data.id=1').set('Origin', EVIL_ORIGIN).send({});
    expect(res.status).not.toBe(403); // la guarda CSRF solo mira sesiones por cookie
  });
});

// helper: token como el del login real (con versión de sesión)
function jwtFor(user: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { signSession } = require('../src/modules/auth/session');
  return signSession(user);
}

describe('Webhook de pagos: idempotencia, carreras y pagos parciales', () => {
  const originalSecret = appConfig.mercadoPago.webhookSecret;
  beforeAll(() => { appConfig.mercadoPago.webhookSecret = SECRET; });
  afterAll(() => { appConfig.mercadoPago.webhookSecret = originalSecret; });
  afterEach(() => jest.restoreAllMocks());

  it('cinco notificaciones simultáneas del mismo pago registran UNA sola venta', async () => {
    const order = await mkOrder();
    payment(order, {});
    await Promise.all([1, 2, 3, 4, 5].map((n) => hook('9001', `r${n}`)));
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(1);
    expect(((await Order.findById(order._id).lean()) as any).deposit).toBe(8000);
  });

  it('una seña (50 %) NO marca el pedido como pagado ni registra la venta completa; el saldo sí la cierra, una sola vez', async () => {
    const order = await mkOrder();
    payment(order, { transaction_amount: 4000, metadata: { deposit: true } });
    await hook('9002');
    let fresh: any = await Order.findById(order._id).lean();
    expect(fresh.deposit).toBe(4000);
    expect(fresh.isSaleRegistered).toBeFalsy();
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(0);
    const status = await request(app).get(`/api/payments/status/${order._id}`);
    expect(status.body.paid).toBe(false);

    jest.restoreAllMocks();
    payment(order, { transaction_amount: 4000, metadata: { balance: true } });
    await hook('9003');
    fresh = await Order.findById(order._id).lean();
    expect(fresh.deposit).toBe(8000);
    expect(fresh.isSaleRegistered).toBe(true);
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(1);
  });

  it('repetir el MISMO pago de saldo (otro request-id) no lo acredita dos veces', async () => {
    const order = await mkOrder();
    await Order.updateOne({ _id: order._id }, { deposit: 2000 });
    payment(order, { transaction_amount: 3000, metadata: { balance: true } });
    await hook('9004', 'a');
    await hook('9004', 'b');
    expect(((await Order.findById(order._id).lean()) as any).deposit).toBe(5000);
  });

  it('GET /payments/status con un id mal formado responde 404, no 500', async () => {
    expect((await request(app).get('/api/payments/status/no-es-un-id')).status).toBe(404);
  });
});

describe('Stock: ventas simultáneas y renglones repetidos', () => {
  it('cinco pedidos públicos a la vez por un producto con stock 3: salen 3, el stock queda en 0 y nunca negativo', async () => {
    const p = await mkProduct(3, { tenantId: PUBLIC_TENANT });
    const place = () => request(app).post('/api/orders/public').send({ clientName: 'Comprador Web', items: [{ productId: String(p._id), productName: 'Mate', quantity: 1, price: 0 }] });
    const results = await Promise.all([1, 2, 3, 4, 5].map(place));
    const ok = results.filter((r) => r.status === 201).length;
    const stock = ((await Product.findById(p._id).lean()) as any).stock;
    expect(stock).toBeGreaterThanOrEqual(0);
    expect(ok).toBe(3);
    expect(stock).toBe(0);
  });

  it('el mismo producto en dos renglones no esquiva el control de stock', async () => {
    const p = await mkProduct(4, { tenantId: PUBLIC_TENANT });
    const res = await request(app).post('/api/orders/public').send({
      clientName: 'Comprador Web',
      items: [{ productId: String(p._id), productName: 'Mate', quantity: 3, price: 0 }, { productId: String(p._id), productName: 'Mate', quantity: 3, price: 0 }],
    });
    expect(res.status).toBe(409);
    expect(((await Product.findById(p._id).lean()) as any).stock).toBe(4);
  });

  it('un producto oculto (isPublic: false) no se puede pedir desde la tienda pública', async () => {
    const p = await mkProduct(5, { isPublic: false, tenantId: PUBLIC_TENANT });
    const res = await request(app).post('/api/orders/public').send({ clientName: 'Comprador Web', items: [{ productId: String(p._id), productName: 'Mate', quantity: 1, price: 0 }] });
    expect(res.status).toBe(409);
  });
});

describe('control positivo de la tienda pública', () => {
  it('un producto público con stock se vende (si no, los 409 de arriba no probarían nada)', async () => {
    const p = await mkProduct(2, { tenantId: PUBLIC_TENANT });
    const res = await request(app).post('/api/orders/public').send({ clientName: 'Comprador Web', items: [{ productId: String(p._id), productName: 'Mate', quantity: 1, price: 0 }] });
    expect(res.status).toBe(201);
    expect(((await Product.findById(p._id).lean()) as any).stock).toBe(1);
  });
});

describe('Registrar venta de un pedido: doble clic simultáneo', () => {
  it('dos requests a la vez crean una sola venta', async () => {
    const order = await mkOrder();
    const go = () => request(app).post(`/api/orders/${order._id}/register-sale`).set('Authorization', bearer('staff', T)).send({});
    await Promise.all([go(), go(), go()]);
    expect(await Sale.countDocuments({ orderId: order._id })).toBe(1);
  });
});

describe('Login por código de email: fuerza bruta', () => {
  it('pasados 10 intentos fallidos desde una IP, el verificador responde 429', async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) {
      last = (await request(app).post('/api/auth/magic/verify').send({ identifier: 'alguien@adv.test', code: String(100000 + i) })).status;
    }
    expect(last).toBe(429);
  });
});

describe('Cotización pública: enlaces', () => {
  it('un fileUrl con esquema peligroso no se guarda', async () => {
    const res = await request(app).post('/api/quotes').send({ clientName: 'X', contact: 'x@x.com', material: 'PLA', dimensionsMm: { x: 10, y: 10, z: 10 }, fileUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });
});

void tokenFor;

describe('Inyección de operadores NoSQL en los endpoints de acceso', () => {
  it('forgot-password, verify-email y magic/verify con objetos ({$ne:null}) no abren nada ni tocan a otros usuarios', async () => {
    const victim: any = await User.create({ name: 'Victima', email: 'victima@adv.test', password: await bcrypt.hash('x', 4), role: 'admin', tenantId: T, verified: false, verificationToken: 'tok-secreto', verificationExpires: new Date(Date.now() + 60_000), magicCode: '777777', magicCodeExpires: new Date(Date.now() + 60_000) });
    const ne = { $ne: null };
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: ne });
    expect(forgot.status).toBeLessThan(500);
    expect(((await User.findById(victim._id).select('+passwordResetToken').lean()) as any).passwordResetToken).toBeUndefined();

    const verify = await request(app).post('/api/auth/verify-email').send({ token: ne });
    expect(verify.status).not.toBe(200);
    expect(verify.body.token).toBeUndefined();

    const magic = await request(app).post('/api/auth/magic/verify').send({ identifier: ne, code: ne });
    expect(magic.status).not.toBe(200);
    expect(magic.body.token).toBeUndefined();

    const login = await request(app).post('/api/auth/login').send({ email: ne, password: ne });
    expect(login.status).toBe(400);
    expect(login.body.token).toBeUndefined();
    expect(((await User.findById(victim._id).lean()) as any).verified).toBe(false);
  });
});

describe('Enumeración de cuentas en el login', () => {
  it('email inexistente y contraseña equivocada responden igual (mismo status y mensaje, sin contador de intentos)', async () => {
    await User.create({ name: 'Real', email: 'real@adv.test', password: await bcrypt.hash('Clave-Larga-Real-12', 4), role: 'staff', tenantId: T, verified: true });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'noexiste@adv.test', password: 'cualquiera123' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'real@adv.test', password: 'cualquiera123' });
    expect(wrong.status).toBe(unknown.status);
    expect(wrong.body.message).toBe(unknown.body.message);
    expect(wrong.body.attemptsRemaining).toBeUndefined();
  });
});

describe('Aislamiento entre talleres en recursos con id (IDOR)', () => {
  it('un admin de otro taller no puede editar ni borrar tareas ni mover una tarea a su taller', async () => {
    const mk = await request(app).post('/api/tasks').set('Authorization', bearer('admin', 'idor_a')).send({ text: 'Tarea A' });
    expect(mk.status).toBe(200);
    const id = mk.body._id;
    const put = await request(app).put(`/api/tasks/${id}`).set('Authorization', bearer('admin', 'idor_b')).send({ completed: true, tenantId: 'idor_b', text: 'robada' });
    expect(put.status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${id}`).set('Authorization', bearer('admin', 'idor_b'))).status).toBe(404);
    const list = await request(app).get('/api/tasks').set('Authorization', bearer('admin', 'idor_a'));
    expect(list.body.map((t: any) => [t.text, t.completed, t.tenantId])).toContainEqual(['Tarea A', false, 'idor_a']);
    // dentro del propio taller, no se puede reasignar el tenantId
    const own = await request(app).put(`/api/tasks/${id}`).set('Authorization', bearer('admin', 'idor_a')).send({ completed: true, tenantId: 'idor_b' });
    expect(own.body.tenantId).toBe('idor_a');
    expect(own.body.completed).toBe(true);
  });

  it('ideas e impresoras de la home: otro taller no las edita ni las borra', async () => {
    const idea = await request(app).post('/api/home/ideas').set('Authorization', bearer('admin', 'idor_a')).send({ name: 'Idea A', image: '/x.png' });
    expect(idea.status).toBe(201);
    expect((await request(app).put(`/api/home/ideas/${idea.body._id}`).set('Authorization', bearer('admin', 'idor_b')).send({ name: 'pisada' })).status).toBe(404);
    expect((await request(app).delete(`/api/home/ideas/${idea.body._id}`).set('Authorization', bearer('admin', 'idor_b'))).status).toBe(404);
    const printer = await request(app).post('/api/home/printers').set('Authorization', bearer('admin', 'idor_a')).send({ name: 'Imp A' });
    expect(printer.status).toBe(201);
    expect((await request(app).put(`/api/home/printers/${printer.body._id}`).set('Authorization', bearer('admin', 'idor_b')).send({ name: 'pisada' })).status).toBe(404);
    expect((await request(app).delete(`/api/home/printers/${printer.body._id}`).set('Authorization', bearer('admin', 'idor_b'))).status).toBe(404);
    const own = await request(app).get('/api/home/ideas').set('Authorization', bearer('admin', 'idor_a'));
    expect(own.body.map((i: any) => i.name)).toContain('Idea A');
  });

  it('empezar un pedido propio con la impresora de OTRO taller no toca esa impresora', async () => {
    const Printer = (await import('../src/modules/printers/printer.model')).default;
    const foreign: any = await Printer.create({ name: 'Ajena', status: 'idle', tenantId: 'idor_b' } as any);
    const order: any = await Order.create({ clientName: 'C', total: 1, trackingCode: 'IDOR-1', tenantId: 'idor_a', items: [{ productName: 'x', quantity: 1, price: 1 }] });
    await request(app).put(`/api/orders/${order._id}/status`).set('Authorization', bearer('staff', 'idor_a')).send({ status: 'in_progress', printerId: String(foreign._id) });
    expect(((await Printer.findById(foreign._id).lean()) as any).status).toBe('idle');
  });
});
