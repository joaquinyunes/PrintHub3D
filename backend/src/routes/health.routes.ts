import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      services: {
        database: {
          status: 'OK',
          responseTime: 0,
        },
      },
    };

    // Verificar conexión a MongoDB
    const startTime = Date.now();
    try {
      await mongoose.connection.db?.admin().ping();
      healthcheck.services.database.responseTime = Date.now() - startTime;
    } catch (dbError) {
      healthcheck.services.database.status = 'ERROR';
      healthcheck.message = 'Database connection failed';
      return res.status(503).json(healthcheck);
    }

    return res.status(200).json(healthcheck);
  } catch (error) {
    return res.status(503).json({
      message: 'Service unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
