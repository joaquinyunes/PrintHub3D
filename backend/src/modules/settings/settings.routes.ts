import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Ajustes de negocio: requieren admin
router.get('/', protect, withTenant, adminOnly, getSettings);
router.put('/', protect, withTenant, adminOnly, updateSettings); // Usamos PUT para actualizar

export default router;