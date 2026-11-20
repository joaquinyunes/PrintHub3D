import { assertDemoDatabase, seedDemoTaller, DEMO_TENANT } from '../src/utils/demoTaller';
import Piece from '../src/modules/production/piece.model';
import Product from '../src/modules/products/product.model';
import Operator from '../src/modules/operators/operator.model';
import Supply from '../src/modules/supplies/supply.model';

describe('entorno de demo (V3)', () => {
  it('se rechaza contra cualquier base que no diga «demo» o sin DEMO_MODE', () => {
    const on = { DEMO_MODE: 'true' };
    expect(() => assertDemoDatabase('mongodb://h/printhub_demo', on)).not.toThrow();
    expect(() => assertDemoDatabase('mongodb+srv://u:p@x.mongodb.net/printhub_demo?retryWrites=true', on)).not.toThrow();
    expect(() => assertDemoDatabase('mongodb://h/global3d', on)).toThrow(/demo/i);
    expect(() => assertDemoDatabase('mongodb://h/', on)).toThrow(/demo/i);
    expect(() => assertDemoDatabase('mongodb://h/printhub_demo', {})).toThrow(/DEMO_MODE/);
    expect(() => assertDemoDatabase(undefined, on)).toThrow(/MONGO_URI/);
  });

  it('carga datos verosímiles, rotulados «demo», con piezas desde las partes; correrlo dos veces no duplica', async () => {
    await expect(seedDemoTaller('corta')).rejects.toThrow(/DEMO_ADMIN_PASSWORD/);
    const first = await seedDemoTaller('Demo-Clave-Larga-2026');
    const second = await seedDemoTaller('Demo-Clave-Larga-2026');
    expect(second).toEqual(first);
    expect(first).toMatchObject({ products: 3, orders: 4, operators: 2, supplies: 3 });
    // Dragón ×2 = 3 partes; Maceta ×4 = 2 partes; Soporte = 1; Dragón ×1 = 3 partes
    expect(first.pieces).toBe(9);
    const names = [...(await Product.find({ tenantId: DEMO_TENANT }).lean()).map((p) => p.name), ...(await Operator.find({ tenantId: DEMO_TENANT }).lean()).map((o) => o.name), ...(await Supply.find({ tenantId: DEMO_TENANT }).lean()).map((s) => s.name)];
    expect(names.every((n) => /demo/i.test(n))).toBe(true);
    const clients = (await Piece.find({ tenantId: DEMO_TENANT }).lean()).map((p) => p.clientName);
    expect(clients.every((c) => /^Cliente Demo \d$/.test(c))).toBe(true);
  });
});
