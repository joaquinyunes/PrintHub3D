import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import path from 'path';
import { appConfig } from './config';

import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import limiter from './middlewares/rateLimiter';
import { swaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';

// Importación de Rutas
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

const app = express();
const httpServer = createServer(app);

// Configuración CORS dinámica
const corsOptions = {
  origin: appConfig.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet()); // Seguridad cabeceras HTTP
app.use(limiter);
app.use(express.json());
//app.use(mongoSanitize()); // Previene inyección NoSQL
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexión Base de Datos con manejo de errores
mongoose
    .connect(appConfig.mongoUri)
    .then(() => logger.info('✅ Base de datos conectada'))
    .catch((err) => {
        logger.error('❌ Error MongoDB:', err);
        process.exit(1);
    });

// Montaje de Rutas
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
app.use('/api/payments', paymentRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/settings/keys', apiKeyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tenant', tenantRoutes);
// Health check
app.use('/api/health', healthRoutes);
// WhatsApp
app.use('/api/whatsapp', whatsappRoutes);
// AI
app.use('/api/ai', aiRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Manejador de Errores Global (Siempre al final)
app.use(errorHandler);

const PORT = appConfig.port;
httpServer.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${PORT} [${appConfig.nodeEnv}]`);
});
