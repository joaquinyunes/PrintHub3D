import { Router } from 'express';
import { 
    getOrders, 
    createOrder, 
    createPublicOrder,
    updateOrderStatus, 
    updateOrder,        
    registerOrderSale,
    fixOrdersData,
    getOrderByTrackingCode,
    submitOrderFeedback,
    resendTrackingToCustomer,
    getOrdersSummary,
    getOrderTimeline,
    markOrderItemPrinted
} from './order.controller'; 
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Public routes (no auth)
router.post('/public', createPublicOrder);
router.get('/track/:trackingCode', getOrderByTrackingCode);
router.post('/track/:trackingCode/feedback', submitOrderFeedback);

// Admin routes (auth required)
router.get('/summary', protect, withTenant, adminOnly, getOrdersSummary);
router.get('/', protect, withTenant, adminOnly, getOrders);
router.post('/', protect, withTenant, adminOnly, createOrder);

// Rutas de edición y estado
router.put('/:id', protect, withTenant, adminOnly, updateOrder); // Editar info general (lápiz)
router.put('/:id/status', protect, withTenant, adminOnly, updateOrderStatus); // Solo estado (impresoras)
router.post('/:id/print-item', protect, withTenant, adminOnly, markOrderItemPrinted); // Marcar un ítem como impreso
router.get('/:id/timeline', protect, withTenant, adminOnly, getOrderTimeline);

// Ruta "Vendido" (Cohete)
// 👈 CORREGIDO: Usamos la función importada correctamente
router.post('/:id/register-sale', protect, withTenant, adminOnly, registerOrderSale);
router.post('/:id/resend-tracking', protect, withTenant, adminOnly, resendTrackingToCustomer);

// Herramienta reparación
router.get('/fix-data', protect, withTenant, adminOnly, fixOrdersData);

export default router;