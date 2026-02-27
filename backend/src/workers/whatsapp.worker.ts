import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';
import {
  sendAdminNotification as sendAdminWhatsApp,
  sendCustomerNotification as sendCustomerWhatsApp,
} from '../modules/notifications/whatsapp.service';
import { NotificationJob } from '../queue/notificationQueue';

if (!appConfig.redisUrl) {
  console.error(
    '❌ REDIS_URL no está configurado. El worker de notificaciones no puede iniciarse.',
  );
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
  console.log(`✅ Notificación procesada: ${job.name} (#${job.id})`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Notificación fallida: ${job?.name} (#${job?.id})`, err);
});

console.log('🚀 Worker de notificaciones WhatsApp iniciado');

