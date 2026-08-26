import crypto from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { appConfig } from '../../config';
import logger from '../../config/logger';

interface CreatePreferenceInput {
  orderId: string;
  trackingCode: string;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  tenantId: string;
  customerEmail?: string;
  deposit?: boolean;
  /** Cobra un importe único fijo (ej: saldo pendiente) en vez de los ítems. */
  fixedAmount?: number;
  fixedTitle?: string;
}

const getClient = (): MercadoPagoConfig => {
  if (!appConfig.mercadoPago.accessToken) {
    throw new Error('MP_ACCESS_TOKEN no configurado');
  }
  return new MercadoPagoConfig({
    accessToken: appConfig.mercadoPago.accessToken,
    options: { timeout: 10000 },
  });
};

export const MercadoPagoService = {
  async createPreference(input: CreatePreferenceInput) {
    const client = getClient();
    const factor = input.deposit ? 0.5 : 1;

    const items =
      input.fixedAmount && input.fixedAmount > 0
        ? [
            {
              id: `${input.orderId}-fixed`,
              title: input.fixedTitle || `Pedido ${input.trackingCode}`,
              quantity: 1,
              currency_id: 'ARS',
              unit_price: Math.round(input.fixedAmount * 100) / 100,
            },
          ]
        : input.items.map((item, idx) => ({
            id: `${input.orderId}-${idx}`,
            title: input.deposit ? `${item.title} (Seña 50%)` : item.title,
            quantity: item.quantity,
            currency_id: 'ARS',
            unit_price: Math.round(item.unitPrice * factor * 100) / 100,
          }));

    const successUrl = `${appConfig.clientUrl}/checkout/resultado`;

    const preference = await new Preference(client).create({
      body: {
        items,
        external_reference: input.orderId,
        metadata: {
          tenantId: input.tenantId,
          trackingCode: input.trackingCode,
          deposit: !!input.deposit,
          balance: !!input.fixedAmount,
        },
        payer: input.customerEmail ? { email: input.customerEmail } : undefined,
        back_urls: {
          success: successUrl,
          failure: successUrl,
          pending: successUrl,
        },
        auto_return: 'approved',
        notification_url: `${appConfig.apiPublicUrl}/api/payments/webhook`,
        statement_descriptor: 'GLOBAL3D',
      },
    });

    logger.info(`MP Preference creada para orden ${input.trackingCode}`, { id: preference.id });
    return {
      id: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  },

  /**
   * Verifica la firma del webhook segun el esquema oficial de MP:
   * header x-signature: "ts=<timestamp>,v1=<hmac_sha256>"
   * manifest: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
   */
  verifyWebhookSignature(headers: Record<string, any>, dataId: string): boolean {
    const secret = appConfig.mercadoPago.webhookSecret;
    if (!secret) {
      if (appConfig.isProduction) {
        logger.error('MP_WEBHOOK_SECRET no configurado en produccion: rechazando webhook');
        return false;
      }
      logger.warn('MP_WEBHOOK_SECRET no configurado (dev): se omite verificacion');
      return true;
    }

    const sigHeader = String(headers['x-signature'] || '');
    const requestId = String(headers['x-request-id'] || '');
    if (!sigHeader) return false;

    const parts = Object.fromEntries(
      sigHeader.split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k?.trim(), v?.trim()];
      }),
    ) as Record<string, string>;

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
    const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
    } catch {
      return false;
    }
  },

  async getPayment(paymentId: string | number) {
    const client = getClient();
    return new Payment(client).get({ id: String(paymentId) });
  },
};
