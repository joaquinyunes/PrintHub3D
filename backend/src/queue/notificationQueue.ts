import { Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';

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
  if (!notificationQueue) {
    // En entornos sin Redis configurado, evitamos romper el flujo
    console.warn(
      `[NotificationQueue] Cola no configurada, se omite job "${job.type}"`,
    );
    return;
  }

  await notificationQueue.add(job.type, job, options);
};

