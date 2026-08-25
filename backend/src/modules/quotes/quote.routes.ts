import { Router, Request, Response } from 'express';
import Quote from './quote.model';
import { estimateQuote, MATERIALS, QuoteInput } from './quote.pricing';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { reqParam } from '../../utils/reqParam';
import { appConfig } from '../../config';
import { sendAdminNotification } from '../notifications/notification.service';
import logger from '../../config/logger';

const router = Router();

const parseInput = (body: any): QuoteInput => ({
  material: String(body.material || 'PLA').toUpperCase(),
  dimensionsMm: {
    x: Number(body?.dimensionsMm?.x) || 0,
    y: Number(body?.dimensionsMm?.y) || 0,
    z: Number(body?.dimensionsMm?.z) || 0,
  },
  solidity: String(body.solidity || 'normal'),
  infill: Number(body.infill) || 20,
  quantity: Math.max(1, Math.round(Number(body.quantity)) || 1),
  finish: String(body.finish || 'estandar'),
  rush: !!body.rush,
});

// Materiales + tarifas visibles (para que el frontend muestre el mismo cálculo)
router.get('/config', (_req: Request, res: Response) => {
  res.json({ materials: MATERIALS });
});

// Estimación en vivo (sin guardar)
router.post('/estimate', (req: Request, res: Response) => {
  res.json({ estimate: estimateQuote(parseInput(req.body)) });
});

// Enviar cotización (público): guarda el lead y avisa al taller
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientName, contact, notes, fileUrl } = req.body;
    if (!clientName || !contact) {
      return res.status(400).json({ message: 'Nombre y contacto son obligatorios' });
    }
    const input = parseInput(req.body);
    const estimate = estimateQuote(input);

    const quote = await Quote.create({
      ...input,
      clientName: String(clientName).trim(),
      contact: String(contact).trim(),
      notes: String(notes || '').slice(0, 1000),
      fileUrl: fileUrl || '',
      estimate,
      tenantId: appConfig.defaultTenantId,
    });

    sendAdminNotification(
      `🧾 *Nueva cotización* de ${quote.clientName} (${quote.contact})\n` +
        `${input.material} · ${input.quantity}u · ${estimate.weightGrams} g · ~${estimate.printHours} h\n` +
        `Total estimado: $${estimate.total.toLocaleString('es-AR')}`,
    ).catch((e) => logger.warn('No se pudo avisar cotización:', e));

    res.status(201).json({ id: quote._id, estimate });
  } catch (error) {
    logger.error('Error creando cotización:', error);
    res.status(500).json({ message: 'Error al enviar la cotización' });
  }
});

// Admin: listar y actualizar estado
router.get('/', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  const items = await Quote.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
});

router.patch('/:id', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  const allowed = ['nuevo', 'contactado', 'convertido', 'descartado'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Estado inválido' });
  const q = await Quote.findOneAndUpdate(
    { _id: reqParam(req, 'id'), tenantId: req.tenantId },
    { status: req.body.status },
    { new: true },
  );
  if (!q) return res.status(404).json({ message: 'Cotización no encontrada' });
  res.json(q);
});

export default router;
