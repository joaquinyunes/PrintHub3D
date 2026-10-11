import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { appConfig } from './config';

import { errorHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/sanitizeInput';
import limiter from './middlewares/rateLimiter';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/auth.routes';
import magicAuthRoutes from './modules/auth/magic-auth.routes';
import productRoutes from './modules/products/product.routes';
import inventoryRoutes from './modules/inventory/inventory-movement.routes';
import orderRoutes from './modules/orders/order.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import clientRoutes from './modules/clients/client.routes';
import chatRoutes from './modules/chat/chat.routes';
import printerRoutes from './modules/printers/printer.routes';
import settingsRoutes from './modules/settings/settings.routes';
import saleRoutes from './modules/sales/sale.routes';
import expenseRoutes from './modules/expense/expense.routes';
import filamentRoutes from './modules/filaments/filament.routes';
import quoteRoutes from './modules/quotes/quote.routes';
import userRoutes from './modules/users/user.routes';
import invoiceRoutes from './modules/invoicing/invoice.routes';
import paymentRoutes from './modules/payments/payment.routes';
import trendsRoutes from './modules/trends/trends.routes';
import homeRoutes from './modules/home/home.routes';
import taskRoutes from './modules/task/task.routes';
import externalRoutes from './modules/external/external.routes';
import apiKeyRoutes from './modules/settings/api-key.routes';
import reportRoutes from './modules/reports/report.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import healthRoutes from './routes/health.routes';
import whatsappRoutes from './modules/notifications/whatsapp.routes';
import aiRoutes from './routes/ai.routes';
import importRoutes from './modules/import/import.routes';
import uploadsRoutes from './routes/uploads.routes';

/**
 * Arma la app de Express SIN efectos secundarios (no conecta a la DB ni abre
 * puertos). El arranque real vive en server.ts; los tests importan esto
 * directamente con supertest.
 */
export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: appConfig.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use(limiter);
  app.use(express.json({ limit: '15mb' })); // 15mb: la importación de la planilla manda cientos de filas en un POST
  app.use(cookieParser());
  app.use(sanitizeInput);

  // Archivos subidos: primero el disco (legado), después GridFS (persistente).
  app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'), {
      setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );
  app.use('/uploads', uploadsRoutes);

  app.use('/api/tasks', taskRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', magicAuthRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/printers', printerRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/filaments', filamentRoutes);
  app.use('/api/quotes', quoteRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/trends', trendsRoutes);
  app.use('/api/home', homeRoutes);
  app.use('/api/external', externalRoutes);
  app.use('/api/settings/keys', apiKeyRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/tenant', tenantRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/import', importRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorHandler);

  return app;
};

export default createApp;
