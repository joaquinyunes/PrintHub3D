import { Router } from 'express';
import { 
    getOrders, 
    createOrder, 
    updateOrderStatus, 
    updateOrder,        
    registerOrderSale, // 👈 CORREGIDO (Antes decía registerOrderAsSale)
    fixOrdersData,
    getOrderByTrackingCode,
    submitOrderFeedback,
    resendTrackingToCustomer,
    getOrdersSummary,
    getOrderTimeline
} from './order.controller'; 
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

router.get('/track/:trackingCode', getOrderByTrackingCode);
router.post('/track/:trackingCode/feedback', submitOrderFeedback);

router.get('/summary', protect, adminOnly, getOrdersSummary);
router.get('/', protect, adminOnly, getOrders);
router.post('/', protect, adminOnly, createOrder);

// Rutas de edición y estado
router.put('/:id', protect, adminOnly, updateOrder); // Editar info general (lápiz)
router.put('/:id/status', protect, adminOnly, updateOrderStatus); // Solo estado (impresoras)
router.get('/:id/timeline', protect, adminOnly, getOrderTimeline);

// Ruta "Vendido" (Cohete)
// 👈 CORREGIDO: Usamos la función importada correctamente
router.post('/:id/register-sale', protect, adminOnly, registerOrderSale);
router.post('/:id/resend-tracking', protect, adminOnly, resendTrackingToCustomer);

// Herramienta reparación
router.get('/fix-data', protect, adminOnly, fixOrdersData);

export default router;