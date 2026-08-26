import { Router } from 'express';
import { getDashboardStats, getReportsData, getProfitability } from './analytics.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.get('/dashboard', protect, withTenant, adminOnly, getDashboardStats);
router.get('/reports', protect, withTenant, adminOnly, getReportsData);
router.get('/profitability', protect, withTenant, adminOnly, getProfitability);

export default router;
