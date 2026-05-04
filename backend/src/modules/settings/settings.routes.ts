import { Router } from 'express';
import { protect, adminOnly } from '../auth/auth.middleware';
import apiKeyRoutes from './api-key.routes';

const router = Router();

// Montar rutas de API Keys bajo /api/settings/keys
router.use('/keys', protect, adminOnly, apiKeyRoutes);

export default router;