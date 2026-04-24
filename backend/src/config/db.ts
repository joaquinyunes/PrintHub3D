import mongoose from 'mongoose';
import { appConfig } from './index';

let memoryServer: any = null;

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(appConfig.mongoUri);
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        return;
    } catch (error: any) {
        console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
        // If in development, attempt to start an in-memory MongoDB for local work
        if (process.env.NODE_ENV !== 'production') {
            try {
                const { MongoMemoryServer } = await import('mongodb-memory-server');
                memoryServer = await MongoMemoryServer.create();
                const uri = memoryServer.getUri();
                const conn = await mongoose.connect(uri);
                console.log(`✅ MongoDB MemoryServer iniciado en: ${uri}`);
                return;
            } catch (memErr: any) {
                console.error('❌ Error iniciando MongoMemoryServer:', memErr);
                process.exit(1);
            }
        }
        process.exit(1);
    }
};

export const stopMemoryServer = async () => {
    try {
        if (memoryServer) await memoryServer.stop();
    } catch (e) { /* noop */ }
};