import { Router } from 'express';
import { importExcel, importStatus } from './import.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.get('/status', protect, withTenant, adminOnly, importStatus);
router.post('/excel', protect, withTenant, adminOnly, importExcel);

export default router;
