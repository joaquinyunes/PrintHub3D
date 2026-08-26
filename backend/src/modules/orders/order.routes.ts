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
import { protect, staffOrAdmin, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { zodValidator } from '../../middleware/zodValidator';
import { CreateOrderSchema, UpdateOrderStatusSchema, OrderFeedbackSchema } from '../../validators/order.validator';

const router = Router();

// Public routes (no auth)
router.post('/public', zodValidator({ body: CreateOrderSchema }), createPublicOrder);
router.get('/track/:trackingCode', getOrderByTrackingCode);
router.post('/track/:trackingCode/feedback', zodValidator({ body: OrderFeedbackSchema }), submitOrderFeedback);

// Admin routes (auth required)
router.get('/summary', protect, withTenant, staffOrAdmin, getOrdersSummary);
router.get('/', protect, withTenant, staffOrAdmin, getOrders);
router.post('/', protect, withTenant, staffOrAdmin, zodValidator({ body: CreateOrderSchema }), createOrder);

// Rutas de edición y estado
router.put('/:id', protect, withTenant, staffOrAdmin, zodValidator({ body: CreateOrderSchema }), updateOrder);
router.put('/:id/status', protect, withTenant, staffOrAdmin, zodValidator({ body: UpdateOrderStatusSchema }), updateOrderStatus);
router.post('/:id/print-item', protect, withTenant, staffOrAdmin, markOrderItemPrinted);
router.get('/:id/timeline', protect, withTenant, staffOrAdmin, getOrderTimeline);

router.post('/:id/register-sale', protect, withTenant, staffOrAdmin, registerOrderSale);
router.post('/:id/resend-tracking', protect, withTenant, staffOrAdmin, resendTrackingToCustomer);

router.post('/fix-data', protect, withTenant, adminOnly, fixOrdersData);

export default router;