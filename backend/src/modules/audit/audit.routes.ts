import { Router } from 'express';
import AuditLog from './audit.model';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

// Solo lectura y solo para admin: no hay POST/PUT/DELETE a propósito.
const router = Router();
router.get('/', protect, withTenant, adminOnly, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  res.json({ items: await AuditLog.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(limit).lean() });
});
export default router;
