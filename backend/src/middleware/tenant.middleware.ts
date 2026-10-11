import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Resuelve el tenant de la request.
 *
 * - Usuario autenticado: SIEMPRE el tenant de su token. El header `x-tenant-id`
 *   se ignora, si no cualquier usuario podría leer datos de otro taller.
 * - Sin usuario (solo desarrollo): header `x-tenant-id` o el tenant por defecto.
 */
export const withTenant = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  let tenantId: string | undefined;
  if (user) {
    tenantId = user.tenantId;
  } else if (!appConfig.isProduction) {
    tenantId = req.header('x-tenant-id') || undefined;
  }

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
