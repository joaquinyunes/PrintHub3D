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
import { zodValidator } from '../../middleware/zodValidator';
import { ProductSchema, ProductSearchSchema } from '../../validators/product.validator';

const router = Router();
router.post('/bulk-stock', protect, withTenant, adminOnly, bulkAddStock);
router.get('/summary', protect, withTenant, adminOnly, getProductsSummary);
router.get('/', protect, withTenant, adminOnly, zodValidator({ query: ProductSearchSchema }), getProducts);
router.get('/public', getPublicProducts);
router.post('/', protect, withTenant, adminOnly, zodValidator({ body: ProductSchema }), createProduct);
router.delete('/:id', protect, withTenant, adminOnly, deleteProduct);
router.put('/:id', protect, withTenant, adminOnly, zodValidator({ body: ProductSchema }), updateProduct);
router.post('/:id/sell', protect, withTenant, adminOnly, quickSell);

export default router;