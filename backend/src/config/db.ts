import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
        // No cerramos el proceso, intentamos reconectar o manejar el error
        process.exit(1);
    }
};