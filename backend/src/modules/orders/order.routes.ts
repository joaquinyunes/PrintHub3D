import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, approveOrder } from './order.controller';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/approve', approveOrder); // Nueva ruta para poner tiempo
router.put('/:id/status', updateOrderStatus);

export default router;