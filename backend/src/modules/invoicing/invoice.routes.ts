import { Router, Response } from 'express';
import Order from '../orders/order.model';
import Invoice from './invoice.model';
import { AfipService } from './afip.service';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { reqParam } from '../../utils/reqParam';
import logger from '../../config/logger';

const router = Router();

// Estado de la integración
router.get('/status', protect, withTenant, adminOnly, (_req, res: Response) => {
  res.json({ configured: AfipService.configured(), provider: 'AFIP WSFEv1' });
});

// Listar comprobantes
router.get('/', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  const items = await Invoice.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
});

// Emitir factura de un pedido
router.post('/order/:id', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  try {
    const order: any = await Order.findOne({ _id: reqParam(req, 'id'), tenantId: req.tenantId });
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    const type = ['A', 'B', 'C'].includes(req.body.type) ? req.body.type : 'B';
    const result = await AfipService.emitInvoice({
      type,
      total: Number(order.total || 0),
      customerDoc: String(req.body.customerDoc || ''),
      customerName: req.body.customerName || order.clientName,
      concept: 'ambos',
    });

    const invoice = await Invoice.create({
      orderId: order._id,
      type: result.type as any,
      pointOfSale: result.pointOfSale,
      number: result.number,
      cae: result.cae,
      caeExpires: result.caeExpires,
      total: result.total,
      net: result.net,
      vat: result.vat,
      customerDoc: String(req.body.customerDoc || ''),
      customerName: req.body.customerName || order.clientName,
      tenantId: req.tenantId,
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    if (error?.code === 'AFIP_NOT_CONFIGURED' || error?.code === 'AFIP_NOT_IMPLEMENTED') {
      return res.status(501).json({ message: error.message, code: error.code });
    }
    logger.error('Error emitiendo factura:', error);
    res.status(500).json({ message: 'Error emitiendo la factura' });
  }
});

export default router;
