import { Router, Response } from 'express';
import Filament from './filament.model';
import { protect, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { reqParam } from '../../utils/reqParam';

const router = Router();

// Listar filamentos del tenant
router.get('/', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const items = await Filament.find({ tenantId: req.tenantId }).sort({ material: 1, color: 1 });
    res.json({ items });
  } catch {
    res.status(500).json({ message: 'Error obteniendo filamentos' });
  }
});

// Crear
router.post('/', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const { brand, material, color, costPerKg, gramsTotal, gramsRemaining, spools, lowThresholdGrams, notes } = req.body;
    if (!brand) return res.status(400).json({ message: 'La marca es obligatoria' });

    const total = Number(gramsTotal) || 1000;
    const filament = await Filament.create({
      tenantId: req.tenantId,
      brand,
      material: material || 'PLA',
      color: color || 'Negro',
      costPerKg: Number(costPerKg) || 0,
      gramsTotal: total,
      gramsRemaining: gramsRemaining != null ? Number(gramsRemaining) : total,
      spools: Number(spools) || 1,
      lowThresholdGrams: Number(lowThresholdGrams) || 200,
      notes: notes || '',
    });
    res.status(201).json(filament);
  } catch {
    res.status(500).json({ message: 'Error creando filamento' });
  }
});

// Actualizar
router.put('/:id', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const allowed = ['brand', 'material', 'color', 'costPerKg', 'gramsTotal', 'gramsRemaining', 'spools', 'lowThresholdGrams', 'notes'];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const filament = await Filament.findOneAndUpdate(
      { _id: reqParam(req, 'id'), tenantId: req.tenantId },
      update,
      { new: true },
    );
    if (!filament) return res.status(404).json({ message: 'Filamento no encontrado' });
    res.json(filament);
  } catch {
    res.status(500).json({ message: 'Error actualizando filamento' });
  }
});

// Consumir gramos (descuento por trabajo / ajuste manual)
router.post('/:id/consume', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const grams = Number(req.body.grams);
    if (!Number.isFinite(grams) || grams <= 0) {
      return res.status(400).json({ message: 'grams debe ser un número positivo' });
    }
    const filament = await Filament.findOne({ _id: reqParam(req, 'id'), tenantId: req.tenantId });
    if (!filament) return res.status(404).json({ message: 'Filamento no encontrado' });

    filament.gramsRemaining = Math.max(0, filament.gramsRemaining - grams);
    await filament.save();
    res.json(filament);
  } catch {
    res.status(500).json({ message: 'Error registrando consumo' });
  }
});

// Recargar bobina (suma gramos y opcionalmente una bobina)
router.post('/:id/refill', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const filament = await Filament.findOne({ _id: reqParam(req, 'id'), tenantId: req.tenantId });
    if (!filament) return res.status(404).json({ message: 'Filamento no encontrado' });

    const grams = Number(req.body.grams);
    filament.gramsRemaining += Number.isFinite(grams) && grams > 0 ? grams : filament.gramsTotal;
    if (req.body.addSpool) filament.spools += 1;
    await filament.save();
    res.json(filament);
  } catch {
    res.status(500).json({ message: 'Error recargando filamento' });
  }
});

// Eliminar
router.delete('/:id', protect, withTenant, staffOrAdmin, async (req: any, res: Response) => {
  try {
    const deleted = await Filament.findOneAndDelete({ _id: reqParam(req, 'id'), tenantId: req.tenantId });
    if (!deleted) return res.status(404).json({ message: 'Filamento no encontrado' });
    res.json({ message: 'Filamento eliminado' });
  } catch {
    res.status(500).json({ message: 'Error eliminando filamento' });
  }
});

export default router;
