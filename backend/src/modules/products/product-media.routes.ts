import { Router } from 'express';
import { getProductMedia, createProductMedia, deleteProductMedia } from './product-media.controller';
import { protect } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();
router.get('/media', protect, withTenant, getProductMedia);
router.post('/media', protect, withTenant, createProductMedia);
router.delete('/media/:id', protect, withTenant, deleteProductMedia);

export default router;