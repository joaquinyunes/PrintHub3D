import { EventEmitter } from 'events';
import twilio, { Twilio } from 'twilio';
import { appConfig } from '../../config';
import logger from '../../config/logger';

/**
 * Envío de WhatsApp vía Twilio (API oficial de WhatsApp Business).
 * Configurable por env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 * Si falta configuración, las funciones registran el mensaje y no fallan el flujo.
 */

export const whatsappEvents = new EventEmitter();

const isConfigured = (): boolean =>
  Boolean(appConfig.whatsapp.twilioSid && appConfig.whatsapp.twilioToken && appConfig.whatsapp.twilioFrom);

let client: Twilio | null = null;
const getClient = (): Twilio => {
  if (!client) {
    client = twilio(appConfig.whatsapp.twilioSid, appConfig.whatsapp.twilioToken);
  }
  return client;
};

const toWhatsAppAddress = (raw: string): string => {
  let n = String(raw || '').trim();
  if (!n) return '';
  if (n.startsWith('whatsapp:')) return n;
  n = n.replace(/[^\d+]/g, '');
  if (!n.startsWith('+')) n = `+${n}`;
  return `whatsapp:${n}`;
};

export const getWhatsAppStatus = () => ({
  provider: 'twilio' as const,
  isReady: isConfigured(),
  hasQr: false,
  qr: '',
});

export const sendWhatsAppMessage = async (to: string, message: string): Promise<boolean> => {
  const dest = toWhatsAppAddress(to);
  if (!dest) {
    logger.warn('WhatsApp: destinatario vacío, se omite el envío');
    return false;
  }
  if (!isConfigured()) {
    logger.warn(`WhatsApp no configurado (Twilio). Mensaje NO enviado a ${dest}: ${message.slice(0, 80)}`);
    return false;
  }

  try {
    const res = await getClient().messages.create({
      from: toWhatsAppAddress(appConfig.whatsapp.twilioFrom),
      to: dest,
      body: message,
    });
    logger.info(`WhatsApp enviado a ${dest}`, { sid: res.sid, status: res.status });
    return true;
  } catch (err) {
    logger.error(`Error enviando WhatsApp a ${dest}:`, err);
    return false;
  }
};

export const sendCustomerNotification = async (to: string, message: string): Promise<boolean> => {
  return sendWhatsAppMessage(to, message);
};

export const sendAdminNotification = async (message: string): Promise<boolean> => {
  const admin = appConfig.whatsapp.adminNumber;
  if (!admin) {
    logger.warn(`WhatsApp admin no configurado (ADMIN_WHATSAPP). Aviso: ${message.slice(0, 80)}`);
    return false;
  }
  return sendWhatsAppMessage(admin, message);
};

export const sendWhatsAppAlert = async (message: string): Promise<boolean> => {
  return sendAdminNotification(message);
};

// Compatibilidad con la API anterior basada en whatsapp-web.js (QR). No aplica a Twilio.
export const initializeWhatsApp = async (): Promise<void> => {
  logger.info(`WhatsApp (Twilio) ${isConfigured() ? 'configurado' : 'sin configurar'}`);
};
export const disconnectWhatsApp = async (): Promise<void> => {
  client = null;
};
export const reconnectWhatsApp = async (): Promise<void> => {
  client = null;
  getClient();
};
