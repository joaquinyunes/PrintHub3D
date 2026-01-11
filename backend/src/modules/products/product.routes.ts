import { Router } from 'express';
import { getProducts, getPublicProducts, createProduct, deleteProduct } from './product.controller';
import { protect, adminOnly } from '../auth/auth.middleware'; // 👈 Importar

const router = Router();

// Rutas Públicas
router.get('/storefront', getPublicProducts);

// Rutas Privadas (SOLO ADMIN PUEDE TOCAR EL INVENTARIO)
router.get('/', protect, adminOnly, getProducts);
router.post('/', protect, adminOnly, createProduct); // Crear
router.delete('/:id', protect, adminOnly, deleteProduct); // Borrar

export default router;