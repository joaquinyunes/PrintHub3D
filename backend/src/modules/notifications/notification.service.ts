import { enqueueNotification } from '../../queue/notificationQueue';
import { appConfig } from '../../config';

export const sendAdminNotification = async (
  message: string,
  tenantId?: string,
): Promise<boolean> => {
  if (appConfig.redisUrl) {
    await enqueueNotification({
      type: 'whatsapp-admin',
      tenantId,
      message,
    });
    return true;
  }

  // Fallback: envío directo si no hay cola configurada
  const { sendAdminNotification: sendAdminWhatsApp } = await import(
    './whatsapp.service'
  );
  return sendAdminWhatsApp(message);
};

export const sendCustomerNotification = async (
  phone: string,
  message: string,
  tenantId?: string,
): Promise<boolean> => {
  if (appConfig.redisUrl) {
    await enqueueNotification({
      type: 'whatsapp-customer',
      tenantId,
      phone,
      message,
    });
    return true;
  }

  // Fallback: envío directo si no hay cola configurada
  const { sendCustomerNotification: sendCustomerWhatsApp } = await import(
    './whatsapp.service'
  );
  return sendCustomerWhatsApp(phone, message);
};

