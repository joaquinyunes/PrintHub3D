import { Router, Request, Response } from 'express';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { enqueuePDFJob } from '../../queue/pdfQueue';

const router = Router();

// Solicitar reporte de ventas
router.post('/sales', protect, withTenant, adminOnly, async (req: any, res) => {
  try {
    const { format = 'pdf', dateFrom, dateTo } = req.body;

    const job = await enqueuePDFJob({
      type: 'report',
      tenantId: req.user.tenantId,
      userId: req.user.id,
      reportType: 'sales',
      dateFrom,
      dateTo,
      format,
    });

    res.json({
      message: 'Reporte en cola. Se notificará cuando esté listo.',
      jobId: job?.id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generando reporte' });
  }
});

// Solicitar remito de orden
router.post('/remito/:orderId', protect, withTenant, adminOnly, async (req: any, res) => {
  try {
    const { orderId } = req.params;

    await enqueuePDFJob({
      type: 'remito',
      tenantId: req.user.tenantId,
      orderId,
      userId: req.user.id,
    });

    res.json({ message: 'Remito en cola. Se notificará cuando esté listo.' });
  } catch (error) {
    res.status(500).json({ message: 'Error generando remito' });
  }
});

// Solicitar presupuesto
router.post('/presupuesto', protect, withTenant, adminOnly, async (req: any, res) => {
  try {
    const { items, clientName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items requeridos' });
    }

    await enqueuePDFJob({
      type: 'presupuesto',
      tenantId: req.user.tenantId,
      userId: req.user.id,
      items,
      clientName: clientName || 'Cliente',
    });

    res.json({ message: 'Presupuesto en cola. Se notificará cuando esté listo.' });
  } catch (error) {
    res.status(500).json({ message: 'Error generando presupuesto' });
  }
});

export default router;
