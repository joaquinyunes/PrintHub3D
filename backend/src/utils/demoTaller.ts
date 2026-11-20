import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Product from '../modules/products/product.model';
import Order from '../modules/orders/order.model';
import Piece from '../modules/production/piece.model';
import Operator from '../modules/operators/operator.model';
import Supply, { supplyKey } from '../modules/supplies/supply.model';
import User from '../modules/auth/user.model';
import { OrderService } from '../modules/orders/order.service';
import { passwordProblem } from './passwordPolicy';

/**
 * Taller de DEMOSTRACIÓN (V3): datos de ejemplo verosímiles para mostrar el producto sin tocar nunca datos reales.
 * Todo lleva «(demo)» y los clientes son «Cliente Demo N». Solo corre contra una base cuyo nombre contiene «demo»
 * y con DEMO_MODE=true: así es imposible pisar una base de producción por error.
 */
export const DEMO_TENANT = 'demo_taller';

export const assertDemoDatabase = (mongoUri: string | undefined, env: Record<string, string | undefined> = process.env): void => {
  if (env.DEMO_MODE !== 'true') throw new Error('Falta DEMO_MODE=true: este script solo corre en el entorno de demo.');
  if (!mongoUri) throw new Error('Falta MONGO_URI.');
  const dbName = (() => {
    try {
      return new URL(mongoUri).pathname.replace(/^\//, '').split('?')[0];
    } catch {
      return '';
    }
  })();
  if (!/demo/i.test(dbName)) throw new Error(`La base «${dbName || '(sin nombre)'}» no tiene «demo» en el nombre: se rechaza para no tocar datos reales.`);
};

const day = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

/** Borra y vuelve a crear los datos del taller de demo (idempotente). */
export const seedDemoTaller = async (adminPassword: string) => {
  const weak = passwordProblem(adminPassword, 'admin');
  if (weak) throw new Error(`DEMO_ADMIN_PASSWORD: ${weak}`);
  const t = DEMO_TENANT;

  await Promise.all([
    Piece.deleteMany({ tenantId: t }), Order.deleteMany({ tenantId: t }), Product.deleteMany({ tenantId: t }),
    Operator.deleteMany({ tenantId: t }), Supply.deleteMany({ tenantId: t }), User.deleteMany({ tenantId: t }),
  ]);

  await User.create({ name: 'Admin Demo', email: 'admin@demo.example', password: await bcrypt.hash(adminPassword, 10), role: 'admin', tenantId: t, verified: true });
  await User.create({ name: 'Personal Demo', email: 'personal@demo.example', password: await bcrypt.hash(adminPassword, 10), role: 'staff', tenantId: t, verified: true });
  for (const [name, pin] of [['Lucía (demo)', '4827'], ['Marcos (demo)', '5938']] as const) {
    await Operator.create({ tenantId: t, name, pinHash: await bcrypt.hash(pin, 10) });
  }

  const dragon: any = await Product.create({ tenantId: t, name: 'Dragón articulado (demo)', category: 'Figuras', price: 12000, cost: 3000, stock: 20, isPublic: true, sku: 'DEMO-DRAGON',
    parts: [{ label: 'Cabeza', color: 'Rojo', quantity: 1 }, { label: 'Cuerpo', color: 'Negro', quantity: 2 }, { label: 'Cola', color: 'Rojo', quantity: 1 }] });
  const maceta: any = await Product.create({ tenantId: t, name: 'Maceta doble (demo)', category: 'Hogar', price: 6500, cost: 1500, stock: 30, isPublic: true, sku: 'DEMO-MACETA',
    parts: [{ label: 'Base', color: 'Blanco', quantity: 1 }, { label: 'Tapa', color: 'Verde', quantity: 1 }] });
  const soporte: any = await Product.create({ tenantId: t, name: 'Soporte de auriculares (demo)', category: 'Escritorio', price: 4800, cost: 1100, stock: 40, isPublic: true, sku: 'DEMO-SOPORTE',
    parts: [{ label: 'Soporte completo', color: 'Gris', quantity: 1 }] });

  const mk = (clientName: string, due: number, productId: unknown, productName: string, quantity: number) =>
    OrderService.createOrder({ tenantId: t, clientName, origin: 'Local', dueDate: day(due), items: [{ productId: String(productId), productName, quantity, price: 0 }] });
  await mk('Cliente Demo 1', -2, dragon._id, dragon.name, 2); // atrasado
  await mk('Cliente Demo 2', 0, maceta._id, maceta.name, 4); // hoy
  await mk('Cliente Demo 3', 1, soporte._id, soporte.name, 6); // mañana
  await mk('Cliente Demo 4', 5, dragon._id, dragon.name, 1); // la semana que viene

  for (const [name, unit, stock, min] of [['Imanes 8 mm (demo)', 'unidades', 120, 50], ['Argollas (demo)', 'unidades', 40, 100], ['Cajas chicas (demo)', 'unidades', 25, 10]] as const) {
    await Supply.create({ tenantId: t, name, nameKey: supplyKey(name), unit, stock, minStock: min });
  }

  return {
    products: await Product.countDocuments({ tenantId: t }),
    orders: await Order.countDocuments({ tenantId: t }),
    pieces: await Piece.countDocuments({ tenantId: t }),
    operators: await Operator.countDocuments({ tenantId: t }),
    supplies: await Supply.countDocuments({ tenantId: t }),
  };
};

export const connectDemo = async (uri: string) => mongoose.connect(uri);
