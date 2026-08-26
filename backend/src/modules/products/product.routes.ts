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
import { protect, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { zodValidator } from '../../middleware/zodValidator';
import { ProductSchema, ProductSearchSchema } from '../../validators/product.validator';

const router = Router();
router.post('/bulk-stock', protect, withTenant, staffOrAdmin, bulkAddStock);
router.get('/summary', protect, withTenant, staffOrAdmin, getProductsSummary);
router.get('/', protect, withTenant, staffOrAdmin, zodValidator({ query: ProductSearchSchema }), getProducts);
router.get('/public', getPublicProducts);
router.post('/', protect, withTenant, staffOrAdmin, zodValidator({ body: ProductSchema }), createProduct);
router.delete('/:id', protect, withTenant, staffOrAdmin, deleteProduct);
router.put('/:id', protect, withTenant, staffOrAdmin, zodValidator({ body: ProductSchema }), updateProduct);
router.post('/:id/sell', protect, withTenant, staffOrAdmin, quickSell);

export default router;