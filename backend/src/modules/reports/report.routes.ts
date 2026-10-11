import { Router, Request, Response } from 'express';
import { protect, adminOnly, authUser } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { enqueuePDFJob } from '../../queue/pdfQueue';
import { reqParam } from '../../utils/reqParam';

const router = Router();

router.post('/sales', protect, withTenant, adminOnly, async (req, res) => {
  try {
    const { format = 'pdf', dateFrom, dateTo } = req.body;
    await enqueuePDFJob({
      type: 'report',
      tenantId: authUser(req).tenantId,
      userId: authUser(req).id,
      reportType: 'sales',
      dateFrom,
      dateTo,
      format,
    });
    res.json({ message: 'Reporte en cola. Se notificará cuando esté listo.' });
  } catch (error) {
    res.status(500).json({ message: 'Error generando reporte' });
  }
});

// Solicitar remito de orden
router.post('/remito/:orderId', protect, withTenant, adminOnly, async (req, res) => {
  try {
    const orderId = reqParam(req, 'orderId');

    await enqueuePDFJob({
      type: 'remito',
      tenantId: authUser(req).tenantId,
      orderId,
      userId: authUser(req).id,
    });

    res.json({ message: 'Remito en cola. Se notificará cuando esté listo.' });
  } catch (error) {
    res.status(500).json({ message: 'Error generando remito' });
  }
});

// Solicitar presupuesto
router.post('/presupuesto', protect, withTenant, adminOnly, async (req, res) => {
  try {
    const { items, clientName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items requeridos' });
    }

    await enqueuePDFJob({
      type: 'presupuesto',
      tenantId: authUser(req).tenantId,
      userId: authUser(req).id,
      items,
      clientName: clientName || 'Cliente',
    });

    res.json({ message: 'Presupuesto en cola. Se notificará cuando esté listo.' });
  } catch (error) {
    res.status(500).json({ message: 'Error generando presupuesto' });
  }
});

export default router;
