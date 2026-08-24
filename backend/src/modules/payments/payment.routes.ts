import { Router, Request, Response } from 'express';
import Order from '../orders/order.model';
import Sale from '../sales/sale.model';
import { OrderService } from '../orders/order.service';
import { MercadoPagoService } from './mercadopago.service';
import { enqueueNotification } from '../../queue/notificationQueue';
import { paymentLimiter } from '../../middlewares/rateLimiter';
import { appConfig } from '../../config';
import logger from '../../config/logger';

const router = Router();

const isEmail = (v?: string) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Crear preferencia de pago en MercadoPago.
// Acepta { orderId } (pedido ya creado) o { clientName, items, customerContact } (checkout web).
router.post('/create-preference', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId, deposit, items, clientName, customerContact, notes } = req.body;

    let order: any;

    if (orderId) {
      order = await Order.findOne({ _id: orderId });
      if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    } else {
      if (!clientName || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Datos de pedido incompletos' });
      }
      order = await OrderService.createOrder({
        tenantId: appConfig.defaultTenantId,
        clientName: String(clientName).trim(),
        origin: 'Web',
        paymentMethod: 'MercadoPago',
        deposit: 0,
        notes: notes || '',
        items: items.map((i: any) => ({
          productId: i.productId,
          productName: i.productName || i.name,
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
          isCustom: !!i.isCustom,
        })),
        dueDate: null,
        files: [],
        customerContact: customerContact || '',
      });
    }

    const prefItems = order.items.map((item: any) => ({
      title: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    const preference = await MercadoPagoService.createPreference({
      orderId: order._id.toString(),
      trackingCode: order.trackingCode,
      items: prefItems,
      tenantId: order.tenantId,
      customerEmail: isEmail(order.customerContact) ? order.customerContact : undefined,
      deposit,
    });

    res.json({
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
      orderId: order._id,
      trackingCode: order.trackingCode,
    });
  } catch (error: any) {
    if (String(error?.message || '').startsWith('Stock insuficiente')) {
      return res.status(409).json({ message: error.message });
    }
    logger.error('Error creando preferencia MP:', error);
    res.status(500).json({ message: 'Error al crear preferencia de pago' });
  }
});

// Webhook de MercadoPago
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type || req.query.topic || req.body?.type || '') as string;
    const dataId = (req.query['data.id'] || req.query.id || req.body?.data?.id || '') as string;

    if (!MercadoPagoService.verifyWebhookSignature(req.headers as Record<string, any>, dataId)) {
      logger.warn('Firma de webhook MP invalida');
      return res.status(401).json({ message: 'Firma invalida' });
    }

    // Responder rapido; procesar despues no es necesario aqui pero MP exige 200/201 < 22s.
    if (type !== 'payment' || !dataId) {
      return res.status(200).json({ ok: true });
    }

    const payment: any = await MercadoPagoService.getPayment(dataId);
    if (!payment) return res.status(200).json({ ok: true });

    const order: any = await Order.findOne({ _id: payment.external_reference });
    if (!order) {
      logger.warn(`Orden no encontrada para webhook MP: ${payment.external_reference}`);
      return res.status(200).json({ ok: true });
    }

    if (payment.status === 'approved') {
      order.paymentMethod = 'MercadoPago';
      order.deposit = payment.transaction_amount || order.deposit;

      if (!order.isSaleRegistered) {
        await new Sale({
          productName: `Pedido web: ${order.clientName}`,
          productId: order._id,
          orderId: order._id,
          quantity: 1,
          price: order.total,
          cost: 0,
          profit: order.total,
          category: 'Web',
          tenantId: order.tenantId,
        }).save();
        order.isSaleRegistered = true;
      }

      await order.save();
      logger.info(`Pago aprobado y venta registrada para orden ${order.trackingCode}`);

      if (order.customerContact) {
        await enqueueNotification({
          type: 'whatsapp-customer',
          tenantId: order.tenantId,
          phone: order.customerContact,
          message: `¡Pago confirmado! Tu pedido ${order.trackingCode} quedó acreditado por $${payment.transaction_amount}. Seguimiento: ${appConfig.clientUrl}/track?code=${order.trackingCode}`,
        }).catch((e) => logger.warn('No se pudo encolar notificacion MP:', e));
      }
    } else if (['rejected', 'cancelled'].includes(payment.status)) {
      logger.info(`Pago ${payment.status} para orden ${order.trackingCode}`);
    }

    res.status(200).json({ ok: true });
  } catch (error: any) {
    logger.error('Error en webhook MP:', error);
    res.status(500).json({ message: 'Error en webhook' });
  }
});

// Estado de pago para el frontend (pantalla de confirmacion)
router.get('/status/:orderId', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const order: any = await Order.findOne({ _id: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    res.json({
      orderId: order._id,
      trackingCode: order.trackingCode,
      paymentMethod: order.paymentMethod,
      deposit: order.deposit,
      total: order.total,
      status: order.status,
      paid: !!order.isSaleRegistered,
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de pago:', error);
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
});

export default router;
