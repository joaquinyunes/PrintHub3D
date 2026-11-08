import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Supply, { supplyKey } from './supply.model';
import { getSheetsSource, planSync } from './supply.sync';
import { protect, adminOnly, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { zodValidator } from '../../middleware/zodValidator';
import { audit } from '../audit/audit.service';
import logger from '../../config/logger';

const router = Router();
router.use(protect, withTenant, staffOrAdmin);

const num = z.number().finite().min(0).max(1e9);
const CreateSchema = z.object({ name: z.string().trim().min(1).max(80), unit: z.string().trim().max(20).optional(), stock: num.optional(), minStock: num.optional() });
const UpdateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), unit: z.string().trim().max(20).optional(), minStock: num.optional() });
const AdjustSchema = z.object({ delta: z.number().finite().min(-1e9).max(1e9).refine((n) => n !== 0, 'El ajuste no puede ser 0'), reason: z.string().trim().max(200).optional() });
const SyncSchema = z.object({ apply: z.boolean().optional() });

const dup = (e: any) => e?.code === 11000;

router.get('/', async (req: Request, res: Response) => {
  const items = await Supply.find({ tenantId: req.tenantId }).sort({ name: 1 }).lean();
  res.json({ items: items.map((s) => ({ ...s, low: s.stock <= s.minStock })) });
});

router.post('/', adminOnly, zodValidator({ body: CreateSchema }), async (req: Request, res: Response) => {
  const { name, unit, stock, minStock } = req.body;
  try {
    const s = await Supply.create({ tenantId: req.tenantId, name, nameKey: supplyKey(name), unit: unit || 'unidades', stock: stock ?? 0, minStock: minStock ?? 0 });
    await audit(req, 'supply.create', String(s._id), { name, stock: s.stock });
    res.status(201).json(s);
  } catch (e) {
    if (dup(e)) return res.status(409).json({ message: 'Ya existe un insumo con ese nombre.' });
    throw e;
  }
});

router.patch('/:id', adminOnly, zodValidator({ body: UpdateSchema }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const s = mongoose.isValidObjectId(id) ? await Supply.findOne({ _id: id, tenantId: req.tenantId }) : null;
  if (!s) return res.status(404).json({ message: 'Insumo no encontrado.' });
  const { name, unit, minStock } = req.body;
  if (name !== undefined) { s.name = name; s.nameKey = supplyKey(name); }
  if (unit !== undefined) s.unit = unit || 'unidades';
  if (minStock !== undefined) s.minStock = minStock;
  try {
    await s.save();
  } catch (e) {
    if (dup(e)) return res.status(409).json({ message: 'Ya existe un insumo con ese nombre.' });
    throw e;
  }
  await audit(req, 'supply.update', id, { name, unit, minStock });
  res.json(s);
});

// Entrada o salida de stock. Atómico y condicional: nunca deja el stock negativo, aunque dos personas ajusten a la vez.
router.post('/:id/adjust', zodValidator({ body: AdjustSchema }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { delta, reason } = req.body;
  const filter: Record<string, unknown> = { _id: id, tenantId: req.tenantId };
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Insumo no encontrado.' });
  if (delta < 0) filter.stock = { $gte: -delta };
  const s = await Supply.findOneAndUpdate(filter, { $inc: { stock: delta } }, { returnDocument: 'after' });
  if (!s) {
    const exists = await Supply.exists({ _id: id, tenantId: req.tenantId });
    return exists ? res.status(409).json({ message: 'No alcanza el stock para esa salida.' }) : res.status(404).json({ message: 'Insumo no encontrado.' });
  }
  await audit(req, 'supply.adjust', id, { delta, reason: reason ?? '', newStock: s.stock });
  res.json(s);
});

// Sincronización con la planilla (solo lectura de la planilla). Sin `apply` solo informa las diferencias.
router.post('/sync', adminOnly, zodValidator({ body: SyncSchema }), async (req: Request, res: Response) => {
  const source = getSheetsSource();
  if (!source) {
    return res.status(501).json({ message: 'La sincronización con Google Sheets no está configurada (GOOGLE_SHEETS_ID, GOOGLE_SHEETS_RANGE, GOOGLE_SERVICE_ACCOUNT_JSON).', code: 'SHEETS_NOT_CONFIGURED' });
  }
  let rows: string[][];
  try {
    rows = await source.readRows();
  } catch (e) {
    logger.error('No se pudo leer la planilla de insumos', e instanceof Error ? e.message : e);
    return res.status(502).json({ message: 'No se pudo leer la planilla. Revisá que esté compartida con la cuenta de servicio y que el rango sea correcto.' });
  }
  const existing = await Supply.find({ tenantId: req.tenantId }).lean();
  const plan = planSync(existing as never[], rows);
  if (!req.body.apply) return res.json({ applied: false, plan });

  // Aplicar: las filas inválidas no se tocan; el resto sí.
  for (const r of plan.create) {
    await Supply.create({ tenantId: req.tenantId, name: r.name, nameKey: supplyKey(r.name), unit: r.unit, stock: r.stock, minStock: r.minStock, source: 'sheet' });
  }
  for (const u of plan.update) {
    await Supply.updateOne({ _id: u.id as mongoose.Types.ObjectId, tenantId: req.tenantId }, { $set: { unit: u.row.unit, stock: u.row.stock, minStock: u.row.minStock, source: 'sheet' } });
  }
  await audit(req, 'supply.sync', '', { created: plan.create.length, updated: plan.update.length, invalid: plan.invalid.length });
  res.json({ applied: true, plan });
});

export default router;
