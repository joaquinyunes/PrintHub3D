import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Order from '../orders/order.model';
import Piece from './piece.model';
import { protect, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { zodValidator } from '../../middleware/zodValidator';
import {
  NEXT_PIECE_STATUS,
  PartLine,
  dueInfo,
  groupQueueByColor,
  groupQueueByCustomer,
  normalizeColor,
  piecesForItem,
  weekBucket,
} from './pieces.logic';

// Cola "¿Qué imprimo?" portada de global3d-corrientes: un pedido se parte en piezas (con color) y el taller
// ve qué imprimir agrupado por color o por cliente, lo más urgente primero.
const router = Router();
router.use(protect, withTenant, staffOrAdmin);

const todayAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const GenerateSchema = z.object({
  items: z
    .array(
      z.object({
        itemIndex: z.number().int().min(0),
        parts: z
          .array(z.object({ label: z.string().min(1).max(80), color: z.string().max(40).optional().default(''), quantity: z.number().int().min(1).max(999).optional().default(1) }))
          .max(30),
      }),
    )
    .max(50)
    .optional(),
});

router.get('/queue', async (req: Request, res: Response) => {
  const mode = req.query.group === 'customer' ? 'customer' : 'color';
  const today = todayAR();
  const pieces = await Piece.find({ tenantId: req.tenantId, status: { $ne: 'done' } }).lean();
  const entries = pieces.map((p) => ({
    _id: String(p._id),
    orderId: String(p.orderId),
    trackingCode: p.trackingCode,
    itemName: p.itemName,
    label: p.label,
    color: p.color ?? null,
    quantityTotal: p.quantityTotal,
    quantityDone: p.quantityDone,
    status: p.status,
    dueDate: p.dueDate,
    customerKey: p.customerKey,
    customerName: p.clientName,
    due: dueInfo(p.dueDate, today),
    bucket: weekBucket(p.dueDate, today),
  }));
  res.json({ today, group: mode, groups: mode === 'customer' ? groupQueueByCustomer(entries) : groupQueueByColor(entries) });
});

router.post('/orders/:orderId/pieces', zodValidator({ body: GenerateSchema }), async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = mongoose.isValidObjectId(orderId) ? await Order.findOne({ _id: orderId, tenantId: req.tenantId }) : null;
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
  if (!order.items?.length) return res.status(400).json({ message: 'El pedido no tiene ítems.' });
  if (await Piece.exists({ tenantId: req.tenantId, orderId: order._id })) return res.status(409).json({ message: 'Este pedido ya tiene piezas.' });

  const partsByIndex = new Map<number, PartLine[]>((req.body.items ?? []).map((i: { itemIndex: number; parts: PartLine[] }) => [i.itemIndex, i.parts]));
  const dueDate = order.dueDate ? new Date(order.dueDate).toISOString().slice(0, 10) : '';
  const docs = order.items.flatMap((item, idx) => {
    const parts = partsByIndex.get(idx);
    const pieces = parts?.length
      ? piecesForItem(parts, item.quantity)
      : [{ label: item.productName, color: null, quantity: Math.max(1, Math.floor(item.quantity)) }];
    return pieces.map((p) => ({
      tenantId: req.tenantId, orderId: order._id, trackingCode: order.trackingCode, clientName: order.clientName,
      customerKey: normalizeColor(order.clientName), itemName: item.productName, label: p.label, color: p.color,
      quantityTotal: p.quantity, dueDate,
    }));
  });
  res.status(201).json(await Piece.insertMany(docs));
});

router.patch('/pieces/:id/advance', async (req: Request, res: Response) => {
  const { id } = req.params;
  const piece = mongoose.isValidObjectId(id) ? await Piece.findOne({ _id: id, tenantId: req.tenantId }) : null;
  if (!piece) return res.status(404).json({ message: 'Pieza no encontrada.' });
  const next = NEXT_PIECE_STATUS[piece.status];
  const quantityDone = next === 'done' ? piece.quantityTotal : next === 'pending' ? 0 : piece.quantityDone;
  // Condicional al estado leído: si otro operario la movió en el medio, no se pisa.
  const updated = await Piece.findOneAndUpdate({ _id: piece._id, tenantId: req.tenantId, status: piece.status }, { $set: { status: next, quantityDone } }, { returnDocument: 'after' });
  if (!updated) return res.status(409).json({ message: 'La pieza cambió mientras tanto. Recargá la cola.' });
  res.json(updated);
});

export default router;
