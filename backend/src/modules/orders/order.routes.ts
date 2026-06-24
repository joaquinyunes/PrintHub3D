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
import { zodValidator } from '../../middleware/zodValidator';
import { CreateOrderSchema, UpdateOrderStatusSchema, OrderFeedbackSchema } from '../../validators/order.validator';

const router = Router();

// Public routes (no auth)
router.post('/public', zodValidator({ body: CreateOrderSchema }), createPublicOrder);
router.get('/track/:trackingCode', getOrderByTrackingCode);
router.post('/track/:trackingCode/feedback', zodValidator({ body: OrderFeedbackSchema }), submitOrderFeedback);

// Admin routes (auth required)
router.get('/summary', protect, withTenant, adminOnly, getOrdersSummary);
router.get('/', protect, withTenant, adminOnly, getOrders);
router.post('/', protect, withTenant, adminOnly, zodValidator({ body: CreateOrderSchema }), createOrder);

// Rutas de edición y estado
router.put('/:id', protect, withTenant, adminOnly, zodValidator({ body: CreateOrderSchema }), updateOrder);
router.put('/:id/status', protect, withTenant, adminOnly, zodValidator({ body: UpdateOrderStatusSchema }), updateOrderStatus);
router.post('/:id/print-item', protect, withTenant, adminOnly, markOrderItemPrinted);
router.get('/:id/timeline', protect, withTenant, adminOnly, getOrderTimeline);

router.post('/:id/register-sale', protect, withTenant, adminOnly, registerOrderSale);
router.post('/:id/resend-tracking', protect, withTenant, adminOnly, resendTrackingToCustomer);

router.get('/fix-data', protect, withTenant, adminOnly, fixOrdersData);

export default router;