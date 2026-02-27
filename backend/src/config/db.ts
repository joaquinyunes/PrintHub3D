import mongoose from 'mongoose';
import { appConfig } from './index';

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(appConfig.mongoUri);

        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};