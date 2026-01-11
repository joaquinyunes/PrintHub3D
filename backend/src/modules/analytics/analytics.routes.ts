import { Router } from 'express';
import { getDashboardStats } from './analytics.controller';

const router = Router();

router.get('/dashboard', getDashboardStats);

export default router;