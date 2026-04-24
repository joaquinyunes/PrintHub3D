import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { appConfig } from './config';

// Importación de Rutas
import taskRoutes from './modules/task/task.routes';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/product.routes';
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

const app = express();
const httpServer = createServer(app);

// 👇 AQUÍ ESTÁ EL CAMBIO CLAVE PARA EL CORS 👇
const corsOptions = {
  origin: [
    'https://print-hub3-d-git-main-joaquinyunes-projects.vercel.app', // Tu dominio de Vercel
    'http://localhost:3000' // Para cuando pruebas en tu PC
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true, // Fundamental para que pase el login y los tokens
};

app.use(cors(corsOptions));
// 👆 -------------------------------------- 👆

app.use(express.json());

mongoose
    .connect(appConfig.mongoUri)
    .then(() => console.log('✅ Base de datos conectada'))
    .catch((err) => console.error('❌ Error MongoDB:', err));

// Conexión de Rutas a la API
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
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

const PORT = appConfig.port;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});