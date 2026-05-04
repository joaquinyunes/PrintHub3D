import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import ApiKey from '../modules/settings/api-key.model';
import logger from '../config/logger';

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    tenantId: string;
    scopes: string[];
  };
}

export const apiKeyAuth = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  const rawKey = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (apiKeyHeader as string | undefined);

  if (!rawKey) {
    return res.status(401).json({ message: 'API Key requerida' });
  }

  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyDoc = await ApiKey.findOne({
    hashedKey,
    active: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  });

  if (!keyDoc) {
    logger.warn(`API Key inválida o expirada: ${req.ip}`);
    return res.status(401).json({ message: 'API Key inválida o expirada' });
  }

  // Actualizar último uso
  keyDoc.lastUsed = new Date();
  await keyDoc.save();

  req.apiKey = {
    id: keyDoc._id.toString(),
    tenantId: keyDoc.tenantId,
    scopes: keyDoc.scopes,
  };

  // Inyectar tenantId para que los controladores lo usen
  (req as any).tenantId = keyDoc.tenantId;

  next();
};

// Middleware para verificar scope específico
export const requireScope = (requiredScope: string) => {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey?.scopes.includes(requiredScope)) {
      return res.status(403).json({ message: `Scope requerido: ${requiredScope}` });
    }
    next();
  };
};
