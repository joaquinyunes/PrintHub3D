import { Router, Request, Response } from 'express';
import Order from '../orders/order.model';
import { MercadoPagoService } from './mercadopago.service';
import { enqueueNotification } from '../../queue/notificationQueue';
import { paymentLimiter } from '../../middlewares/rateLimiter';
import logger from '../../config/logger';

const router = Router();

// Crear preferencia de pago en MercadoPago (protegido contra spam)
router.post('/create-preference', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId, deposit } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId requerido' });
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const items = order.items.map(item => ({
      title: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    const preference = await MercadoPagoService.createPreference({
      orderId: order._id.toString(),
      trackingCode: order.trackingCode,
      items,
      tenantId: order.tenantId,
      customerEmail: order.customerContact || undefined,
      deposit,
    });

    res.json({
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
    });
  } catch (error: any) {
    logger.error('Error creando preferencia MP:', error);
    res.status(500).json({ message: 'Error al crear preferencia de pago' });
  }
});

// Webhook de MercadoPago (sin limitador para asegurar recepción)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature'] || req.headers['x-signature'];
    const rawBody = JSON.stringify(req.body);

    // Verificar firma si está configurada
    if (signature && !MercadoPagoService.verifyWebhookSignature(req.headers as Record<string, string>, rawBody)) {
      logger.warn('Firma de webhook MP inválida');
      return res.status(401).json({ message: 'Firma inválida' });
    }

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      logger.info(`Webhook MP recibido: pago ${paymentId}`);

      const payment = await MercadoPagoService.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      const orderId = payment.external_reference;
      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        logger.warn(`Orden no encontrada para webhook MP: ${orderId}`);
        return res.json({ ok: true });
      }

      if (payment.status === 'approved') {
        order.paymentMethod = 'MercadoPago';
        order.deposit = payment.transaction_amount;
        await order.save();

        logger.info(`Pago aprobado para orden ${order.trackingCode}`);

        // Notificar al cliente por WhatsApp
        if (order.customerContact) {
          await enqueueNotification({
            type: 'whatsapp-customer',
            tenantId: order.tenantId,
            phone: order.customerContact,
            message: `¡Pago confirmado! Tu orden ${order.trackingCode} ha sido acreditada. Total: $${payment.transaction_amount}`,
          });
        }
      }
    }

    res.json({ ok: true });
  } catch (error: any) {
    logger.error('Error en webhook MP:', error);
    res.status(500).json({ message: 'Error en webhook' });
  }
});

// Obtener estado de pago (para frontend - protegido contra spam)
router.get('/status/:orderId', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    res.json({
      orderId: order._id,
      trackingCode: order.trackingCode,
      paymentMethod: order.paymentMethod,
      deposit: order.deposit,
      total: order.total,
      status: order.status,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de pago:', error);
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
});

export default router;