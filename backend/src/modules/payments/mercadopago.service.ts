import { Payment, Preference } from 'mercadopago';
import { appConfig } from '../../config';
import logger from '../../config/logger';

interface CreatePreferenceInput {
  orderId: string;
  trackingCode: string;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  tenantId: string;
  customerEmail?: string;
  deposit?: boolean;
}

export const MercadoPagoService = {
  async createPreference(input: CreatePreferenceInput) {
    if (!appConfig.mercadoPago.accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN no configurado');
    }

    const mercadopago = require('mercadopago');
    mercadopago.configure({ access_token: appConfig.mercadoPago.accessToken });

    const items = input.deposit
      ? input.items.map(item => ({
          title: `${item.title} (Seña 50%)`,
          quantity: item.quantity,
          currency_id: 'ARS',
          unit_price: Math.round(item.unitPrice * 0.5 * 100) / 100,
        }))
      : input.items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          currency_id: 'ARS',
          unit_price: item.unitPrice,
        }));

    const preference = await Preference.create({
      body: {
        items,
        external_reference: input.orderId,
        payer: input.customerEmail ? { email: input.customerEmail } : undefined,
        back_urls: {
          success: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
          failure: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
          pending: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/webhook`,
      },
    });

    logger.info(`MP Preference creada para orden ${input.trackingCode}`, { id: preference.id });
    return { id: preference.id, initPoint: preference.init_point, sandboxInitPoint: preference.sandbox_init_point };
  },

  verifyWebhookSignature(headers: Record<string, string>, body: string): boolean {
    const secret = appConfig.mercadoPago.webhookSecret;
    if (!secret) {
      logger.warn('MP_WEBHOOK_SECRET no configurado, omitiendo verificación');
      return true;
    }

    const crypto = require('crypto');
    const signature = headers['x-hub-signature'] || headers['x-signature'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expected = `sha256=${hmac.digest('hex')}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  },

  async getPayment(paymentId: string) {
    if (!appConfig.mercadoPago.accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN no configurado');
    }

    const mercadopago = require('mercadopago');
    mercadopago.configure({ access_token: appConfig.mercadoPago.accessToken });

    const payment = await Payment.findById({ id: paymentId });
    return payment;
  },
};
