import { Router } from 'express';
import { getDashboardStats } from './analytics.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Dashboard y métricas internas: solo administración
router.get('/dashboard', protect, withTenant, adminOnly, getDashboardStats);

export default router;