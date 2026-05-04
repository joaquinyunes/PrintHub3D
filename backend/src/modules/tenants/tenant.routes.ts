import { Router, Request, Response } from 'express';
import TenantSettings from './tenant.model';
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

// Obtener configuración del tenant (requiere autenticación)
router.get('/', protect, adminOnly, async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    let settings = await TenantSettings.findOne({ tenantId }).lean();

    if (!settings) {
      // Crear configuración por defecto
      settings = await TenantSettings.create({ tenantId });
      settings = settings.toObject();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo configuración' });
  }
});

// Actualizar configuración (solo admin)
router.put('/', protect, adminOnly, async (req: any, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, currency, locale, features } = req.body;

    const update: any = {};
    if (name) update.name = name;
    if (currency) update.currency = currency;
    if (locale) update.locale = locale;
    if (features) update.features = features;

    const settings = await TenantSettings.findOneAndUpdate(
      { tenantId },
      update,
      { new: true, upsert: true },
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando configuración' });
  }
});

export default router;
