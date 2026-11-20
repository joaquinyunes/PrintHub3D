import { Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';
import logger from '../config/logger';

export type NotificationJob =
  | {
      type: 'whatsapp-admin';
      tenantId?: string;
      message: string;
    }
  | {
      type: 'whatsapp-customer';
      tenantId?: string;
      phone: string;
      message: string;
    };

const connection = appConfig.redisUrl
  ? new IORedis(appConfig.redisUrl)
  : undefined;

export const notificationQueue = connection
  ? new Queue<NotificationJob>('notifications', { connection })
  : null;

export const enqueueNotification = async (
  job: NotificationJob,
  options?: JobsOptions,
): Promise<void> => {
  // Entorno de demostración (V3): nunca se manda un aviso real a un teléfono.
  if (process.env.DEMO_MODE === 'true') {
    logger.info(`[NotificationQueue] DEMO_MODE: se omite el aviso "${job.type}"`);
    return;
  }

  if (!notificationQueue) {
    // En entornos sin Redis configurado, evitamos romper el flujo
    logger.warn(`[NotificationQueue] Cola no configurada, se omite job "${job.type}"`);
    return;
  }

  await notificationQueue.add(job.type, job, options);
};

