import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config';
import logger from '../config/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const connection = appConfig.redisUrl
  ? new IORedis(appConfig.redisUrl)
  : null;

if (!connection) {
  logger.error('REDIS_URL requerido para PDF worker');
  process.exit(1);
}

const worker = new Worker<PDFJob>(
  'pdf-generation',
  async (job: Job<PDFJob>) => {
    const { type } = job.data;

    if (type === 'report') {
      return await generateReport(job.data);
    } else if (type === 'remito') {
      return await generateRemito(job.data);
    } else if (type === 'presupuesto') {
      return await generatePresupuesto(job.data);
    }
  },
  { connection, concurrency: 2 },
);

async function generateReport(data: Extract<PDFJob, { type: 'report' }>) {
  const doc = new PDFDocument();
  const fileName = `report-${data.reportType}-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../public/reports', fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text(`Reporte de ${data.reportType}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generado: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Aquí iría la lógica real de consulta a BD y tablas
  doc.text('Contenido del reporte...');

  doc.end();
  logger.info(`Reporte generado: ${fileName}`);

  // Notificar al usuario (en una implementación real enviarías el link)
  return { filePath, fileName };
}

async function generateRemito(data: Extract<PDFJob, { type: 'remito' }>) {
  const doc = new PDFDocument();
  const fileName = `remito-${data.orderId}-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../public/remitos', fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('REMITO', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Orden: ${data.orderId}`);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.text('Detalles de la orden...');

  doc.end();
  logger.info(`Remito generado: ${fileName}`);
  return { filePath, fileName };
}

async function generatePresupuesto(data: Extract<PDFJob, { type: 'presupuesto' }>) {
  const doc = new PDFDocument();
  const fileName = `presupuesto-${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../public/presupuestos', fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('PRESUPUESTO', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Cliente: ${data.clientName}`);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  let total = 0;
  data.items.forEach(item => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    doc.text(`${item.name} x${item.quantity} - $${item.price} = $${subtotal}`);
  });

  doc.moveDown();
  doc.fontSize(14).text(`TOTAL: $${total}`, { align: 'right' });

  doc.end();
  logger.info(`Presupuesto generado: ${fileName}`);
  return { filePath, fileName };
}

worker.on('completed', (job) => {
  logger.info(`PDF job completado: ${job.id} (${job.data.type})`);
});

worker.on('failed', (job, err) => {
  logger.error(`PDF job fallido: ${job?.id}`, err);
});

logger.info('PDF Worker iniciado');
