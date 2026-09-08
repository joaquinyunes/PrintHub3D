import { Request, Response } from 'express';
import Order from '../orders/order.model';
import Sale from '../sales/sale.model';
import Expense from '../expense/expense.model';
import Filament from '../filaments/filament.model';
import logger from '../../config/logger';

const BATCH = 'excel';

const getTenantId = (req: Request): string =>
  (req as unknown as { tenantId?: string; user?: { tenantId?: string } }).tenantId ||
  (req as unknown as { user?: { tenantId?: string } }).user?.tenantId ||
  '';

const num = (v: unknown): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
    return isFinite(n) ? n : 0;
  }
  return 0;
};

const str = (v: unknown): string => (v == null ? '' : String(v).trim());

const parseDate = (v: unknown): Date => {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = str(v);
  if (s) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

const ORDER_STATUS: Record<string, string> = {
  '': 'pending',
  'no comenzado': 'pending',
  'pendiente': 'pending',
  'imprimiendo': 'in_progress',
  'en produccion': 'in_progress',
  'en producción': 'in_progress',
  'post-procesado': 'post_processing',
  'postprocesado': 'post_processing',
  'listo': 'completed',
  'terminado': 'completed',
  'entregado': 'delivered',
  'cancelado': 'cancelled',
};

interface ImportBody {
  replace?: boolean;
  pedidos?: Array<Record<string, unknown>>;
  ventasProductos?: Array<Record<string, unknown>>;
  ventasFilamento?: Array<Record<string, unknown>>;
  gastosLocal?: Array<Record<string, unknown>>;
  gastosCasa?: Array<Record<string, unknown>>;
  stockFilamento?: Array<Record<string, unknown>>;
}

/**
 * Importa datos de la planilla histórica ("Pedidos - Nueva.xlsx").
 * El frontend parsea el .xlsx y manda las filas ya normalizadas.
 * Idempotente: con { replace: true } borra primero todo lo importado antes (importBatch = 'excel').
 */
export const importExcel = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ message: 'No autorizado' });

    const body = (req.body || {}) as ImportBody;
    const report: Record<string, number> = {};

    if (body.replace) {
      const [o, s, e, f] = await Promise.all([
        Order.deleteMany({ tenantId, importBatch: BATCH }),
        Sale.deleteMany({ tenantId, importBatch: BATCH }),
        Expense.deleteMany({ tenantId, importBatch: BATCH }),
        Filament.deleteMany({ tenantId, importBatch: BATCH }),
      ]);
      report.borrados =
        (o.deletedCount || 0) + (s.deletedCount || 0) + (e.deletedCount || 0) + (f.deletedCount || 0);
    }

    // --- PEDIDOS ---
    const pedidos = Array.isArray(body.pedidos) ? body.pedidos : [];
    const orderDocs = pedidos
      .filter((p) => str(p.clientName || p.cliente))
      .map((p, i) => {
        const total = num(p.total);
        const product = str(p.product || p.producto) || 'Pedido importado';
        const rawStatus = str(p.status || p.estado).toLowerCase();
        return {
          clientName: str(p.clientName || p.cliente),
          origin: str(p.channel || p.canal) || 'WhatsApp',
          status: ORDER_STATUS[rawStatus] ?? 'pending',
          total,
          deposit: num(p.deposit ?? p.sena ?? p.seña),
          notes: str(p.description || p.descripcion),
          dueDate: p.dueDate || p.fechaEntrega ? parseDate(p.dueDate || p.fechaEntrega) : undefined,
          trackingCode: `IMP-${Date.now().toString(36)}-${i}`,
          items: [{ productName: product, quantity: 1, price: total, isCustom: true }],
          isSaleRegistered: rawStatus === 'entregado',
          importBatch: BATCH,
          tenantId,
        };
      });
    if (orderDocs.length) {
      const r = await Order.insertMany(orderDocs, { ordered: false }).catch((err) => {
        logger.warn('import pedidos parcial:', err?.message);
        return err?.insertedDocs || [];
      });
      report.pedidos = Array.isArray(r) ? r.length : orderDocs.length;
    }

    // --- VENTAS (productos + filamento) ---
    const mapSale = (v: Record<string, unknown>, kind: 'producto' | 'filamento') => {
      const price = num(v.total ?? v.price);
      return {
        productName: str(v.productName || v.producto) || 'Venta importada',
        quantity: Math.max(1, num(v.quantity ?? v.cantidad) || 1),
        price,
        cost: 0,
        profit: price,
        category: kind === 'filamento' ? 'Filamento' : 'Mostrador',
        kind,
        client: str(v.client || v.cliente),
        paymentMethod: str(v.paymentMethod || v.formaPago || v.formaDePago),
        notes: str(v.notes || v.observaciones),
        createdAt: parseDate(v.date || v.fecha),
        importBatch: BATCH,
        tenantId,
      };
    };
    const ventaDocs = [
      ...(Array.isArray(body.ventasProductos) ? body.ventasProductos : []).map((v) => mapSale(v, 'producto')),
      ...(Array.isArray(body.ventasFilamento) ? body.ventasFilamento : []).map((v) => mapSale(v, 'filamento')),
    ].filter((v) => v.price > 0 || v.productName !== 'Venta importada');
    if (ventaDocs.length) {
      const r = await Sale.insertMany(ventaDocs, { ordered: false }).catch((err) => {
        logger.warn('import ventas parcial:', err?.message);
        return err?.insertedDocs || [];
      });
      report.ventas = Array.isArray(r) ? r.length : ventaDocs.length;
    }

    // --- GASTOS (local + casa) ---
    const mapExpense = (g: Record<string, unknown>, type: 'local' | 'casa') => ({
      description: str(g.description || g.descripcion) || 'Gasto importado',
      amount: num(g.amount ?? g.monto),
      category: str(g.category || g.categoria) || 'General',
      date: parseDate(g.date || g.fecha),
      type,
      provider: str(g.provider || g.proveedor),
      paymentMethod: str(g.paymentMethod || g.medioPago || g.medioDePago),
      status: str(g.status || g.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
      notes: str(g.notes || g.observaciones),
      importBatch: BATCH,
      tenantId,
    });
    const gastoDocs = [
      ...(Array.isArray(body.gastosLocal) ? body.gastosLocal : []).map((g) => mapExpense(g, 'local')),
      ...(Array.isArray(body.gastosCasa) ? body.gastosCasa : []).map((g) => mapExpense(g, 'casa')),
    ].filter((g) => g.amount > 0);
    if (gastoDocs.length) {
      const r = await Expense.insertMany(gastoDocs, { ordered: false }).catch((err) => {
        logger.warn('import gastos parcial:', err?.message);
        return err?.insertedDocs || [];
      });
      report.gastos = Array.isArray(r) ? r.length : gastoDocs.length;
    }

    // --- STOCK FILAMENTO (catálogo) ---
    const stock = Array.isArray(body.stockFilamento) ? body.stockFilamento : [];
    const filDocs = stock
      .filter((f) => str(f.brand || f.producto))
      .map((f) => ({
        brand: str(f.brand || f.producto),
        material: str(f.material) || 'PLA',
        color: str(f.color) || 'Sin color',
        costPerKg: num(f.cost ?? f.costo),
        salePrice: num(f.price ?? f.precio),
        spools: Math.max(0, num(f.spools ?? f.rollos)),
        gramsTotal: 1000,
        gramsRemaining: Math.max(0, num(f.spools ?? f.rollos)) * 1000,
        sku: str(f.sku),
        importBatch: BATCH,
        tenantId,
      }));
    if (filDocs.length) {
      const r = await Filament.insertMany(filDocs, { ordered: false }).catch((err) => {
        logger.warn('import filamento parcial:', err?.message);
        return err?.insertedDocs || [];
      });
      report.filamento = Array.isArray(r) ? r.length : filDocs.length;
    }

    return res.json({ message: 'Importación completada', report });
  } catch (error) {
    logger.error('Error importExcel:', error);
    return res.status(500).json({ message: 'Error al importar' });
  }
};

/** Resumen de lo importado + lo que hay en total, para la pantalla de importación. */
export const importStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ message: 'No autorizado' });
    const [pedidos, ventas, gastos, filamento, pedidosTotal, ventasTotal, gastosTotal] = await Promise.all([
      Order.countDocuments({ tenantId, importBatch: BATCH }),
      Sale.countDocuments({ tenantId, importBatch: BATCH }),
      Expense.countDocuments({ tenantId, importBatch: BATCH }),
      Filament.countDocuments({ tenantId, importBatch: BATCH }),
      Order.countDocuments({ tenantId }),
      Sale.countDocuments({ tenantId }),
      Expense.countDocuments({ tenantId }),
    ]);
    return res.json({
      importados: { pedidos, ventas, gastos, filamento },
      totales: { pedidos: pedidosTotal, ventas: ventasTotal, gastos: gastosTotal },
    });
  } catch (error) {
    logger.error('Error importStatus:', error);
    return res.status(500).json({ message: 'Error' });
  }
};
