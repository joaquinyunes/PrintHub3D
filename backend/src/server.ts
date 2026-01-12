import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Rutas
import taskRoutes from './modules/task/task.routes';
import authRoutes from './modules/auth/auth.routes'; // 👈 IMPORTAR
import productRoutes from './modules/products/product.routes';
import orderRoutes from './modules/orders/order.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import clientRoutes from './modules/clients/client.routes';
import chatRoutes from './modules/chat/chat.routes';
import printerRoutes from './modules/printers/printer.routes'; // 👈 NUEVO
import settingsRoutes from './modules/settings/settings.routes'; // Importar
// Servicios
import './modules/notifications/whatsapp.service';
import saleRoutes from './modules/sales/sale.routes';
// En app.ts (o server.ts)


dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/global3d')
    .then(() => console.log('✅ Base de datos conectada'))
    .catch((err) => console.error('❌ Error MongoDB:', err));

// Usar Rutas
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes); // 👈 CONECTAR AUTH
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/printers', printerRoutes); // 👈 CONECTADO
app.use('/api/settings', settingsRoutes); // Usar
app.use('/api/sales', saleRoutes); // 👈 CONECTAR SALES
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});