import { Router } from 'express';
import { getDashboardStats, getReportsData } from './analytics.controller'; // 👈 Agregá getReportsData
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Dashboard general (Home)
router.get('/dashboard', protect, withTenant, adminOnly, getDashboardStats);

// 🚀 NUEVA RUTA PARA TUS REPORTES DE LA PÁGINA DE ANALYTICS
router.get('/reports', protect, withTenant, adminOnly, getReportsData);

export default router;