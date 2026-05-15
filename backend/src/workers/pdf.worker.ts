import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';
import logger from '../config/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface PDFJob {
  type: string;
  orderId?: string;
  reportId?: string;
  tenantId?: string;
  data?: any;
}

const connection = appConfig.redisUrl
  ? new IORedis(appConfig.redisUrl)
  : null;

if (!connection) {
  logger.warn('⚠️ REDIS_URL no configurado. PDF worker no iniciado.');
  process.exit(0);
}

const worker = new Worker<PDFJob>(
  'pdf-generation',
  async (job: Job<PDFJob>) => {
    const { type } = job.data;

    if (type === 'report') {
      return await generateReport(job.data);
    } else if (type === 'remito') {
      return await generateRemito(job.data);
    }

    throw new Error(`Unknown PDF job type: ${type}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  logger.info(`✅ PDF job ${job.id} completado`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ PDF job ${job?.id} falló:`, err.message);
});

async function generateReport(data: any) {
  logger.info('Generando reporte PDF:', data);
  return { success: true, type: 'report' };
}

async function generateRemito(data: any) {
  logger.info('Generando remito PDF:', data);
  return { success: true, type: 'remito' };
}