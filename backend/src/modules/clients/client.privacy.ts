import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Client from './client.model';
import Order from '../orders/order.model';
import Sale from '../sales/sale.model';
import Piece from '../production/piece.model';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { audit } from '../audit/audit.service';

// S12 — Ley 25.326 (Argentina): acceso y supresión de los datos de una persona, a pedido, solo admin.
const router = Router();
router.use(protect, withTenant, adminOnly);

const ERASED = 'Cliente eliminado';

// Exportación: todo lo que el taller guarda de esa persona (cliente, pedidos, ventas), en JSON.
router.get('/:id/export', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const client = mongoose.isValidObjectId(id) ? await Client.findOne({ _id: id, tenantId: req.tenantId }).lean() : null;
  if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
  const [orders, sales] = await Promise.all([
    Order.find({ tenantId: req.tenantId, clientName: client.name }).lean(),
    Sale.find({ tenantId: req.tenantId, client: client.name }).lean(),
  ]);
  await audit(req, 'client.export', id);
  res.setHeader('Content-Disposition', `attachment; filename="cliente-${id}.json"`);
  res.json({ exportedAt: new Date().toISOString(), client, orders, sales });
});

// Supresión: se borra el dato personal pero se conservan los importes (obligación contable/fiscal del taller).
router.delete('/:id/personal-data', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const client = mongoose.isValidObjectId(id) ? await Client.findOne({ _id: id, tenantId: req.tenantId }) : null;
  if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
  const name = client.name;
  const orders = await Order.find({ tenantId: req.tenantId, clientName: name }).select('_id').lean();
  const orderIds = orders.map((o) => o._id);
  await Promise.all([
    Order.updateMany({ _id: { $in: orderIds } }, { $set: { clientName: ERASED, customerContact: '', chatLink: '', notes: '', files: [], referenceUrl: '' } }),
    Piece.updateMany({ tenantId: req.tenantId, orderId: { $in: orderIds } }, { $set: { clientName: ERASED, customerKey: 'cliente eliminado' } }),
    Sale.updateMany({ tenantId: req.tenantId, client: name }, { $set: { client: ERASED, notes: '' } }),
  ]);
  client.name = ERASED;
  client.email = undefined;
  client.phone = undefined;
  client.socialHandle = undefined;
  client.avatar = undefined;
  client.notes = undefined;
  await client.save();
  // En el registro de auditoría va solo el id, nunca los datos borrados.
  await audit(req, 'client.erase', id, { orders: orderIds.length });
  res.json({ message: 'Datos personales eliminados.', ordersAnonymized: orderIds.length });
});

export default router;
