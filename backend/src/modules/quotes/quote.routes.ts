import { Router, Request, Response } from 'express';
import Quote from './quote.model';
import { estimateQuote, MATERIALS, QuoteInput } from './quote.pricing';
import { costQuote } from './quote.cost';
import { z } from 'zod';
import { publicWriteLimiter } from '../../middlewares/rateLimiter';
import { zodValidator } from '../../middleware/zodValidator';
import { protect, adminOnly, staffOrAdmin } from '../auth/auth.middleware';
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
  // 0 % de relleno es válido (pieza hueca): solo se usa 20 cuando no viene el dato.
  infill: body.infill === undefined || body.infill === null || body.infill === '' || !Number.isFinite(Number(body.infill)) ? 20 : Number(body.infill),
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

// Calculadora de costo por pieza (planilla del taller): gramos y horas del slicer + costos reales.
const num = z.number().finite().min(0).max(1e9);
const CostSchema = z.object({
  settings: z.object({ filamentPrice: num, kwhPrice: num, watts: num, lifeHours: num, spareParts: num, errorPct: z.number().finite().min(0).max(100), mlSurcharge: num }),
  piece: z.object({ hours: num, minutes: z.number().finite().min(0).max(1e6), grams: num, extras: num }),
  multiplier: z.number().finite().min(0.01).max(100),
});
router.post('/cost', protect, withTenant, staffOrAdmin, zodValidator({ body: CostSchema }), (req: Request, res: Response) => {
  res.json({ quote: costQuote(req.body.settings, req.body.piece, req.body.multiplier) });
});

// Enviar cotización (público): guarda el lead y avisa al taller
router.post('/', publicWriteLimiter, async (req: Request, res: Response) => {
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
router.get('/', protect, withTenant, adminOnly, async (req, res) => {
  const items = await Quote.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
});

router.patch('/:id', protect, withTenant, adminOnly, async (req, res) => {
  const allowed = ['nuevo', 'contactado', 'convertido', 'descartado'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Estado inválido' });
  const q = await Quote.findOneAndUpdate(
    { _id: reqParam(req, 'id'), tenantId: req.tenantId },
    { status: req.body.status },
    { returnDocument: 'after' },
  );
  if (!q) return res.status(404).json({ message: 'Cotización no encontrada' });
  res.json(q);
});

export default router;
