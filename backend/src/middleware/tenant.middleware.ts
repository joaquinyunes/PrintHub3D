import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const withTenant = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userTenantId = (req as any).user?.tenantId as string | undefined;
  const headerTenantId = req.header('x-tenant-id') || undefined;

  let tenantId = userTenantId || headerTenantId;

  if (!tenantId && !appConfig.isProduction) {
    // En desarrollo permitimos un tenant por defecto para no romper flujos actuales
    tenantId = appConfig.defaultTenantId;
  }

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant no especificado' });
  }

  req.tenantId = tenantId;
  next();
};

