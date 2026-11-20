import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../orders/order.model';
import Sale from '../sales/sale.model';
import { OrderService } from '../orders/order.service';
import { MercadoPagoService } from './mercadopago.service';
import { enqueueNotification } from '../../queue/notificationQueue';
import { paymentLimiter, webhookLimiter } from '../../middlewares/rateLimiter';
import { appConfig } from '../../config';
import logger from '../../config/logger';
import { AppError } from '../../utils/AppError';

const router = Router();

const isEmail = (v?: string) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Crear preferencia de pago en MercadoPago.
// Acepta { orderId } (pedido ya creado) o { clientName, items, customerContact } (checkout web).
router.post('/create-preference', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId, trackingCode, deposit, balance, items, clientName, customerContact, notes } = req.body;

    let order: any;

    if (orderId || trackingCode) {
      order = orderId
        ? await Order.findOne({ _id: orderId })
        : await Order.findOne({ trackingCode: new RegExp(`^${String(trackingCode).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
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
        // Visitante anónimo: el precio se toma SIEMPRE del catálogo, nunca del body.
        trustClientPrices: false,
        items: items.map((i: any) => ({
          productId: i.productId ? String(i.productId) : undefined,
          productName: String(i.productName || i.name || ''),
          quantity: Number(i.quantity) || 1,
          price: 0,
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

    // Pago de saldo pendiente (total - seña ya abonada)
    const remaining = Math.max(0, Number(order.total || 0) - Number(order.deposit || 0));
    if (balance && remaining <= 0) {
      return res.status(400).json({ message: 'Este pedido no tiene saldo pendiente' });
    }

    const preference = await MercadoPagoService.createPreference({
      orderId: order._id.toString(),
      trackingCode: order.trackingCode,
      items: prefItems,
      tenantId: order.tenantId,
      customerEmail: isEmail(order.customerContact) ? order.customerContact : undefined,
      deposit,
      fixedAmount: balance ? remaining : undefined,
      fixedTitle: balance ? `Saldo pedido ${order.trackingCode}` : undefined,
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
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    logger.error('Error creando preferencia MP:', error);
    res.status(500).json({ message: 'Error al crear preferencia de pago' });
  }
});

// Webhook de MercadoPago
router.post('/webhook', webhookLimiter, async (req: Request, res: Response) => {
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

    const ref = String(payment.external_reference || '');
    if (!mongoose.isValidObjectId(ref)) {
      logger.warn('Webhook MP con external_reference inválida');
      return res.status(200).json({ ok: true });
    }
    const order: any = await Order.findOne({ _id: ref });
    if (!order) {
      logger.warn(`Orden no encontrada para webhook MP: ${ref}`);
      return res.status(200).json({ ok: true });
    }

    if (payment.status === 'approved') {
      // Idempotencia: cada pago de MP se acredita UNA vez. El reclamo es atómico, así que cinco notificaciones
      // simultáneas (o un reintento) del mismo pago no duplican ni la seña/saldo ni la venta.
      const paymentKey = String(dataId);
      const claimed = await Order.findOneAndUpdate({ _id: ref, processedPayments: { $ne: paymentKey } }, { $push: { processedPayments: paymentKey } });
      if (!claimed) {
        logger.info(`Pago ${paymentKey} ya procesado: se ignora el aviso repetido`);
        return res.status(200).json({ ok: true });
      }

      try {
        const amountRaw = Number(payment.transaction_amount || 0);
        const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : 0;
        const isBalance = payment.metadata?.balance === true || payment.metadata?.balance === 'true';
        const cur = { $ifNull: ['$deposit', 0] };
        // Saldo: suma sobre lo ya pagado. Seña/total: queda el mayor monto abonado. Siempre con tope en el total.
        // Todo en una sola operación atómica (dos pagos distintos a la vez no se pisan).
        const updated: any = await Order.findOneAndUpdate(
          { _id: ref },
          [{ $set: { paymentMethod: 'MercadoPago', deposit: amount ? { $min: ['$total', isBalance ? { $add: [cur, amount] } : { $max: [cur, amount] }] } : cur } }],
          { returnDocument: 'after', updatePipeline: true },
        );

        // La venta se registra recién cuando el pedido quedó pagado por completo; una seña no es una venta completa.
        if (updated && Number(updated.total) > 0 && Number(updated.deposit) >= Number(updated.total)) {
          const claimSale = await Order.findOneAndUpdate({ _id: ref, isSaleRegistered: { $ne: true } }, { $set: { isSaleRegistered: true } });
          if (claimSale) {
            try {
              await new Sale({
                productName: `Pedido web: ${updated.clientName}`,
                productId: updated._id,
                orderId: updated._id,
                quantity: 1,
                price: updated.total,
                cost: 0,
                profit: updated.total,
                category: 'Web',
                tenantId: updated.tenantId,
              }).save();
            } catch (e) {
              await Order.updateOne({ _id: ref }, { $set: { isSaleRegistered: false } });
              throw e;
            }
          }
        }
        logger.info(`Pago aprobado acreditado para orden ${order.trackingCode}`);
      } catch (e) {
        // No se pudo aplicar: se libera el reclamo para que el reintento de MP lo vuelva a intentar.
        await Order.updateOne({ _id: ref }, { $pull: { processedPayments: paymentKey } }).catch(() => undefined);
        throw e;
      }

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
    const oid = String(req.params.orderId);
    const order: any = mongoose.isValidObjectId(oid) ? await Order.findOne({ _id: oid }) : null;
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    res.json({
      orderId: order._id,
      trackingCode: order.trackingCode,
      paymentMethod: order.paymentMethod,
      deposit: order.deposit,
      total: order.total,
      status: order.status,
      paid: Number(order.total) > 0 && Number(order.deposit || 0) >= Number(order.total),
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado de pago:', error);
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
});

export default router;
