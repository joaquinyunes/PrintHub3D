import { Router, Request, Response } from 'express';
import ApiKey from './api-key.model';
import crypto from 'crypto';
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

// Listar API keys del tenant
router.get('/', protect, adminOnly, async (req: any, res) => {
  try {
    const keys = await ApiKey.find({
      tenantId: req.user.tenantId,
      active: true,
    }).select('-hashedKey -key').lean();

    res.json(keys);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo API keys' });
  }
});

// Crear nueva API key
router.post('/', protect, adminOnly, async (req: any, res) => {
  try {
    const { name, scopes, expiresInDays } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    const apiKey = new ApiKey({
      tenantId: req.user.tenantId,
      name,
      scopes: scopes || ['orders:read', 'orders:write'],
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      createdBy: req.user.id,
    });

    await apiKey.save();

    // Devolver la key recién creada (solo se muestra una vez)
    const plainKey = apiKey.key;
    apiKey.key = undefined; // No guardar en plaintext
    await apiKey.save();

    res.status(201).json({
      message: 'API Key creada. Guarda esta key, no se mostrará nuevamente.',
      key: plainKey,
      id: apiKey._id,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creando API key' });
  }
});

// Revocar API key
router.delete('/:id', protect, adminOnly, async (req: any, res) => {
  try {
    const result = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { active: false },
      { new: true },
    );

    if (!result) {
      return res.status(404).json({ message: 'API Key no encontrada' });
    }

    res.json({ message: 'API Key revocada' });
  } catch (error) {
    res.status(500).json({ message: 'Error revocando API key' });
  }
});

export default router;
