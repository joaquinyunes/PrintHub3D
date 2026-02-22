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

const router = Router();
router.post('/bulk-stock', protect, bulkAddStock);
router.get('/summary', protect, getProductsSummary);
router.get('/', protect, getProducts); // Admin
router.get('/public', getPublicProducts); // Tienda
router.post('/', protect, createProduct); // Crear/Fusionar
router.delete('/:id', protect, deleteProduct);
router.put('/:id', protect, updateProduct);
router.post('/:id/sell', protect, quickSell); // 👈 Ruta necesaria para el botón VENDER

export default router;