import { createServer } from 'http';
import { appConfig } from './config';
import logger from './config/logger';
import { connectDB, disconnectDB } from './config/db';
import { bootstrapAdmin } from './utils/bootstrapAdmin';
import { createApp } from './app';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const start = async (): Promise<void> => {
  // Sin base de datos el servicio no sirve para nada: mejor fallar rápido y que
  // el orquestador (Render/Docker) reinicie, en vez de quedar vivo "a medias".
  await connectDB();
  await bootstrapAdmin();

  const httpServer = createServer(createApp());
  httpServer.listen(appConfig.port, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${appConfig.port} [${appConfig.nodeEnv}]`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} recibido: cerrando servidor...`);

    // Si algo queda colgado, no esperamos para siempre.
    const force = setTimeout(() => {
      logger.error('Cierre ordenado excedió el tiempo: forzando salida');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();

    httpServer.close(async (err) => {
      try {
        await disconnectDB();
      } catch (e) {
        logger.error(`Error cerrando MongoDB: ${(e as Error).message}`);
      }
      process.exit(err ? 1 : 0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason) => {
  logger.error({ msg: 'unhandledRejection', reason: String(reason) });
});

start().catch((err) => {
  logger.fatal({ msg: 'No se pudo iniciar el servidor', err: (err as Error).message });
  process.exit(1);
});
