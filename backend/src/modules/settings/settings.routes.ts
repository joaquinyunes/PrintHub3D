import { Router } from 'express';
import { protect, adminOnly } from '../auth/auth.middleware';
import apiKeyRoutes from './api-key.routes';
import { getSettings, updateSettings } from './settings.controller';

const router = Router();

// Rutas de settings
router.get('/', protect, adminOnly, getSettings);
router.put('/', protect, adminOnly, updateSettings);

// Montar rutas de API Keys bajo /api/settings/keys
router.use('/keys', protect, adminOnly, apiKeyRoutes);

export default router;