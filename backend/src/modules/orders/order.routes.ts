import { Router } from 'express';
import { 
    getOrders, 
    createOrder, 
    updateOrderStatus, 
    updateOrder,        
    registerOrderSale, // 👈 CORREGIDO (Antes decía registerOrderAsSale)
    fixOrdersData 
} from './order.controller'; 
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

router.get('/', protect, adminOnly, getOrders);
router.post('/', protect, adminOnly, createOrder);

// Rutas de edición y estado
router.put('/:id', protect, adminOnly, updateOrder); // Editar info general (lápiz)
router.put('/:id/status', protect, adminOnly, updateOrderStatus); // Solo estado (impresoras)

// Ruta "Vendido" (Cohete)
// 👈 CORREGIDO: Usamos la función importada correctamente
router.post('/:id/register-sale', protect, adminOnly, registerOrderSale);

// Herramienta reparación
router.get('/fix-data', fixOrdersData);

export default router;