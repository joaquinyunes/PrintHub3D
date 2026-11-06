import request from 'supertest';
import { createApp } from '../src/app';
import Order from '../src/modules/orders/order.model';
import Product from '../src/modules/products/product.model';
import Piece from '../src/modules/production/piece.model';
import Operator from '../src/modules/operators/operator.model';
import AuditLog from '../src/modules/audit/audit.model';
import { isWeakPin } from '../src/modules/operators/operator.auth';
import { bearer } from './helpers';

const app = createApp();
const A = 'ops_a';
const B = 'ops_b';

const addOp = async (tenant: string, name: string, pin: string) => {
  const res = await request(app).post('/api/operators').set('Authorization', bearer('admin', tenant)).send({ name, pin });
  expect(res.status).toBe(201);
  return res.body.id as string;
};
const pinLogin = (tenant: string, operatorId: string, pin: string) =>
  request(app).post('/api/operators/login').set('Authorization', bearer('staff', tenant)).send({ operatorId, pin });
const newPiece = async (tenant: string, code: string) => {
  const o: any = await Order.create({ clientName: 'Cli', total: 10, trackingCode: code, tenantId: tenant, items: [{ productName: 'Taza', quantity: 1, price: 10 }] });
  const res = await request(app).post(`/api/production-queue/orders/${o._id}/pieces`).set('Authorization', bearer('admin', tenant)).send({});
  return res.body[0]._id as string;
};

describe('PIN débil', () => {
  it.each([['0000', true], ['1234', true], ['9876', true], ['123', true], ['12345678901', true], ['12a4', true], ['4827', false], ['135790', false]])('%s → débil=%s', (pin, weak) => {
    expect(isWeakPin(pin)).toBe(weak);
  });
});

describe('operarios con PIN', () => {
  it('solo el admin da de alta; el PIN se guarda con bcrypt y nunca se devuelve', async () => {
    const asStaff = await request(app).post('/api/operators').set('Authorization', bearer('staff', A)).send({ name: 'Zeta', pin: '4827' });
    expect(asStaff.status).toBe(403);
    const weak = await request(app).post('/api/operators').set('Authorization', bearer('admin', A)).send({ name: 'Débil', pin: '1234' });
    expect(weak.status).toBe(400);
    const id = await addOp(A, 'Lucía', '4827');
    const stored: any = await Operator.findById(id).select('+pinHash').lean();
    expect(stored.pinHash).toMatch(/^\$2[aby]\$/);
    expect(stored.pinHash).not.toContain('4827');
    const list = await request(app).get('/api/operators').set('Authorization', bearer('staff', A));
    expect(JSON.stringify(list.body)).not.toMatch(/pin|\$2/i);
  });

  it('PIN correcto da token; incorrecto 401 con mensaje genérico', async () => {
    const id = await addOp(A, 'Marcos', '5938');
    expect((await pinLogin(A, id, '0000')).status).toBe(401);
    const ok = await pinLogin(A, id, '5938');
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });

  it('5 PIN incorrectos bloquean al operario, aun con el PIN bueno; el admin lo destraba cambiando el PIN', async () => {
    const id = await addOp(A, 'Nora', '7261');
    for (let i = 0; i < 4; i++) expect((await pinLogin(A, id, '1111')).status).toBe(401);
    expect((await pinLogin(A, id, '1111')).status).toBe(423);
    expect((await pinLogin(A, id, '7261')).status).toBe(423);
    const reset = await request(app).patch(`/api/operators/${id}`).set('Authorization', bearer('admin', A)).send({ pin: '8352' });
    expect(reset.status).toBe(200);
    expect((await pinLogin(A, id, '8352')).status).toBe(200);
  });

  it('aislamiento por taller: un operario del taller A no existe para el taller B', async () => {
    const id = await addOp(A, 'Omar', '6184');
    expect((await pinLogin(B, id, '6184')).status).toBe(401);
    const listB = await request(app).get('/api/operators').set('Authorization', bearer('staff', B));
    expect(listB.body.items.map((o: any) => o.name)).not.toContain('Omar');
    const patchB = await request(app).patch(`/api/operators/${id}`).set('Authorization', bearer('admin', B)).send({ active: false });
    expect(patchB.status).toBe(404);
  });

  it('un token de operario de otro taller no sirve para avanzar piezas', async () => {
    const idA = await addOp(A, 'Pablo', '3917');
    await addOp(B, 'Quique', '2846');
    const { token } = (await pinLogin(A, idA, '3917')).body;
    const pieceB = await newPiece(B, 'OPS-B1');
    const res = await request(app).patch(`/api/production-queue/pieces/${pieceB}/advance`).set('Authorization', bearer('staff', B)).set('x-operator-token', token);
    expect(res.status).toBe(401);
  });

  it('con operarios en el taller, el staff necesita PIN para avanzar y queda registrado quién fue', async () => {
    const id = await addOp(A, 'Rita', '9472');
    const pieceId = await newPiece(A, 'OPS-A1');
    const adv = (token?: string) => {
      const r = request(app).patch(`/api/production-queue/pieces/${pieceId}/advance`).set('Authorization', bearer('staff', A));
      return token ? r.set('x-operator-token', token) : r;
    };
    const sinPin = await adv();
    expect(sinPin.status).toBe(403);
    expect(sinPin.body.code).toBe('PIN_REQUIRED');

    const { token } = (await pinLogin(A, id, '9472')).body;
    const ok = await adv(token);
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('printing');
    expect(ok.body.lastAdvancedBy).toMatchObject({ kind: 'operator', id, name: 'Rita' });
    expect(ok.body.history).toHaveLength(1);
    expect(ok.body.history[0]).toMatchObject({ from: 'pending', to: 'printing', byName: 'Rita' });

    const audits = await AuditLog.find({ tenantId: A, action: 'operator.create' }).lean();
    expect(audits.length).toBeGreaterThan(0);
  });

  it('el token de operario no abre sesión en el resto de la API', async () => {
    const id = await addOp(A, 'Sara', '4073');
    const { token } = (await pinLogin(A, id, '4073')).body;
    const res = await request(app).get('/api/production-queue/queue').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('el admin avanza sin PIN y queda registrado como admin', async () => {
    await addOp(A, 'Tomás', '2619');
    const pieceId = await newPiece(A, 'OPS-A2');
    const res = await request(app).patch(`/api/production-queue/pieces/${pieceId}/advance`).set('Authorization', bearer('admin', A));
    expect(res.status).toBe(200);
    expect(res.body.lastAdvancedBy.kind).toBe('admin');
  });

  it('un operario desactivado ya no puede identificarse ni usar su token', async () => {
    const id = await addOp(A, 'Ulises', '3085');
    const { token } = (await pinLogin(A, id, '3085')).body;
    await request(app).patch(`/api/operators/${id}`).set('Authorization', bearer('admin', A)).send({ active: false });
    expect((await pinLogin(A, id, '3085')).status).toBe(401);
    const pieceId = await newPiece(A, 'OPS-A3');
    const res = await request(app).patch(`/api/production-queue/pieces/${pieceId}/advance`).set('Authorization', bearer('staff', A)).set('x-operator-token', token);
    expect(res.status).toBe(401);
  });

  it('el registro de auditoría no se puede modificar ni borrar', async () => {
    const log = await AuditLog.create({ tenantId: A, action: 'test', actorKind: 'system' });
    await expect(AuditLog.deleteOne({ _id: log._id })).rejects.toThrow(/auditor/i);
    await expect(AuditLog.updateOne({ _id: log._id }, { $set: { action: 'x' } })).rejects.toThrow(/auditor/i);
    const found = await AuditLog.findById(log._id);
    expect(found?.action).toBe('test');
  });
});

describe('piezas automáticas desde las partes del producto', () => {
  it('un ítem con productId toma las partes del producto, × cantidad; el override manual manda', async () => {
    const prod: any = await Product.create({
      name: 'Dragón', price: 100, stock: 5, tenantId: 'parts_a',
      parts: [{ label: 'Cabeza', color: 'Rojo', quantity: 1 }, { label: 'Cuerpo', color: 'Negro', quantity: 2 }],
    });
    const o: any = await Order.create({
      clientName: 'Ana', total: 300, trackingCode: 'PRT-1', tenantId: 'parts_a',
      items: [{ productId: prod._id, productName: 'Dragón', quantity: 3, price: 100 }, { productName: 'Llavero', quantity: 1, price: 0 }],
    });
    const gen = (body: object = {}) => request(app).post(`/api/production-queue/orders/${o._id}/pieces`).set('Authorization', bearer('staff', 'parts_a')).send(body);
    const res = await gen();
    expect(res.status).toBe(201);
    expect(res.body.map((p: any) => [p.label, p.color, p.quantityTotal])).toEqual([['Cabeza', 'Rojo', 3], ['Cuerpo', 'Negro', 6], ['Llavero', null, 1]]);

    await Piece.deleteMany({ orderId: o._id });
    const manual = await gen({ items: [{ itemIndex: 0, parts: [{ label: 'Solo cabeza', quantity: 1 }] }] });
    expect(manual.body.map((p: any) => [p.label, p.quantityTotal])).toEqual([['Solo cabeza', 3], ['Llavero', 1]]);
  });

  it('el producto no toma las partes de un producto de otro taller', async () => {
    const prod: any = await Product.create({ name: 'Ajeno', price: 1, stock: 1, tenantId: 'parts_x', parts: [{ label: 'Parte ajena', quantity: 1 }] });
    const o: any = await Order.create({ clientName: 'Bea', total: 1, trackingCode: 'PRT-2', tenantId: 'parts_b', items: [{ productId: prod._id, productName: 'Ajeno', quantity: 1, price: 1 }] });
    const res = await request(app).post(`/api/production-queue/orders/${o._id}/pieces`).set('Authorization', bearer('staff', 'parts_b')).send({});
    expect(res.body.map((p: any) => p.label)).toEqual(['Ajeno']);
  });

  it('crear/editar un producto guarda y valida sus partes', async () => {
    const created = await request(app).post('/api/products').set('Authorization', bearer('admin', 'parts_c'))
      .send({ name: 'Maceta doble', price: 50, stock: 1, parts: [{ label: 'Base', color: 'Blanco', quantity: 1 }, { label: 'Tapa', quantity: 1 }] });
    expect(created.status).toBe(201);
    expect(created.body.parts.map((p: any) => p.label)).toEqual(['Base', 'Tapa']);
    const bad = await request(app).put(`/api/products/${created.body._id}`).set('Authorization', bearer('admin', 'parts_c'))
      .send({ name: 'Maceta doble', price: 50, parts: [{ label: '', quantity: 0 }] });
    expect(bad.status).toBe(400);
    const edit = await request(app).put(`/api/products/${created.body._id}`).set('Authorization', bearer('admin', 'parts_c'))
      .send({ name: 'Maceta doble', price: 50, parts: [{ label: 'Base', quantity: 2 }] });
    expect(edit.body.parts).toHaveLength(1);
  });
});
