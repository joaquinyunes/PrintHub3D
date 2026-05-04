import { Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';

export type PDFJob =
  | {
      type: 'report';
      tenantId: string;
      userId: string;
      reportType: 'sales' | 'inventory' | 'orders';
      dateFrom?: string;
      dateTo?: string;
      format: 'pdf' | 'xlsx';
    }
  | {
      type: 'remito';
      tenantId: string;
      orderId: string;
      userId: string;
    }
  | {
      type: 'presupuesto';
      tenantId: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      clientName: string;
      userId: string;
    };

const connection = appConfig.redisUrl
  ? new IORedis(appConfig.redisUrl)
  : undefined;

export const pdfQueue = connection
  ? new Queue<PDFJob>('pdf-generation', { connection })
  : null;

export const enqueuePDFJob = async (
  job: PDFJob,
  options?: JobsOptions,
): Promise<void> => {
  if (!pdfQueue) {
    console.warn(`[PDFQueue] Cola no configurada, se omite job "${job.type}"`);
    return;
  }

  await pdfQueue.add(job.type, job, options);
};
