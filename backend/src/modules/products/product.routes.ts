// product.routes.ts
import { Router } from 'express';
import {
    getProducts,
    createProduct,
    deleteProduct,
    updateProduct,
    quickSell,
    getPublicProducts,
    bulkAddStock,
    getProductsSummary
} from './product.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();
router.post('/bulk-stock', protect, withTenant, adminOnly, bulkAddStock);
router.get('/summary', protect, withTenant, adminOnly, getProductsSummary);
router.get('/', protect, withTenant, adminOnly, getProducts);
router.get('/public', getPublicProducts);
router.post('/', protect, withTenant, adminOnly, createProduct);
router.delete('/:id', protect, withTenant, adminOnly, deleteProduct);
router.put('/:id', protect, withTenant, adminOnly, updateProduct);
router.post('/:id/sell', protect, withTenant, adminOnly, quickSell);

export default router;