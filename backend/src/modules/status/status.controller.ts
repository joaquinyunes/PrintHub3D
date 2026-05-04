import { Request, Response } from 'express';
import mongoose from 'mongoose';

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.json({
    status: 'ok',
    db: { readyState: dbState },
    tenantDefault: process.env.DEFAULT_TENANT_ID || null,
    env: process.env.NODE_ENV || 'development',
  });
};
