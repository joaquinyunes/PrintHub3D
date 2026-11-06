import { Request } from 'express';
import AuditLog from './audit.model';
import logger from '../../config/logger';

export interface Actor {
  kind: 'admin' | 'staff' | 'operator' | 'system';
  id: string;
  name: string;
}

/** El actor sale de la sesión; si hay un operario identificado con PIN, manda el operario. */
export const actorOf = (req: Request): Actor => {
  const op = req.operator;
  if (op) return { kind: 'operator', id: op.id, name: op.name };
  const u = req.user;
  return { kind: u?.role === 'admin' ? 'admin' : 'staff', id: u?.id ?? '', name: u?.name ?? '' };
};

/** Nunca rompe la operación principal: si no se pudo registrar, queda en el log del servidor. */
export const audit = async (req: Request, action: string, target = '', detail: Record<string, unknown> = {}) => {
  try {
    const a = actorOf(req);
    await AuditLog.create({ tenantId: req.tenantId, action, target, detail, actorKind: a.kind, actorId: a.id, actorName: a.name });
  } catch (e) {
    logger.error('No se pudo escribir la auditoría', e);
  }
};
