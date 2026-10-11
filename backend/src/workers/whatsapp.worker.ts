import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';
import {
  sendAdminNotification as sendAdminWhatsApp,
  sendCustomerNotification as sendCustomerWhatsApp,
} from '../modules/notifications/whatsapp.service';
import { NotificationJob } from '../queue/notificationQueue';
import logger from '../config/logger';

if (!appConfig.redisUrl) {
  logger.fatal('❌ REDIS_URL no está configurado. El worker de notificaciones no puede iniciarse.');
  process.exit(1);
}

const connection = new IORedis(appConfig.redisUrl);

const worker = new Worker<NotificationJob>(
  'notifications',
  async (job: Job<NotificationJob>) => {
    const data = job.data;

    if (data.type === 'whatsapp-admin') {
      await sendAdminWhatsApp(data.message);
      return;
    }

    if (data.type === 'whatsapp-customer') {
      await sendCustomerWhatsApp(data.phone, data.message);
      return;
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  logger.info(`✅ Notificación procesada: ${job.name} (#${job.id})`);
});

worker.on('failed', (job, err) => {
  logger.error({ msg: `❌ Notificación fallida: ${job?.name} (#${job?.id})`, err: err.message });
});

logger.info('🚀 Worker de notificaciones WhatsApp iniciado');

