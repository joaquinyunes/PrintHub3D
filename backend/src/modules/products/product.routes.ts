// product.routes.ts
import { Router } from 'express';
import { 
    getProducts, 
    createProduct, 
    deleteProduct, 
    updateProduct, 
    quickSell, // 👈 Importante
    getPublicProducts,
    bulkAddStock,
    getProductsSummary
} from './product.controller';

import { protect } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();
router.post('/bulk-stock', protect, withTenant, bulkAddStock);
router.get('/summary', protect, withTenant, getProductsSummary);
router.get('/', protect, withTenant, getProducts); // Admin
router.get('/public', getPublicProducts); // Tienda
router.post('/', protect, withTenant, createProduct); // Crear/Fusionar
router.delete('/:id', protect, withTenant, deleteProduct);
router.put('/:id', protect, withTenant, updateProduct);
router.post('/:id/sell', protect, withTenant, quickSell); // 👈 Ruta necesaria para el botón VENDER

export default router;