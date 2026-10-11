import mongoose from 'mongoose';
import { appConfig } from './index';
import logger from './logger';

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Conecta a MongoDB. Si falla en producción lanza el error (el arranque decide
 * qué hacer, normalmente salir para que el orquestador reinicie el servicio).
 * En desarrollo cae a un MongoDB en memoria para poder trabajar sin instalar nada.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(appConfig.mongoUri);
    logger.info(`✅ MongoDB conectado: ${conn.connection.host}`);
    return;
  } catch (error) {
    logger.error(`❌ Error de conexión a MongoDB: ${(error as Error).message}`);
    if (appConfig.isProduction) throw error;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const server = await MongoMemoryServer.create();
  memoryServer = server;
  const uri = server.getUri();
  await mongoose.connect(uri);
  logger.warn(`⚠️  Usando MongoDB en memoria (solo desarrollo): ${uri}`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  await stopMemoryServer();
};

export const stopMemoryServer = async (): Promise<void> => {
  try {
    if (memoryServer) await memoryServer.stop();
  } catch {
    /* noop */
  }
  memoryServer = null;
};
