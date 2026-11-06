import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../config';
import Operator from './operator.model';

export interface OperatorClaims {
  typ: 'operator';
  id: string;
  name: string;
  tenantId: string;
}

declare global {
  namespace Express {
    interface Request {
      operator?: { id: string; name: string };
    }
  }
}

export const OPERATOR_HEADER = 'x-operator-token';
export const OPERATOR_TOKEN_TTL = '12h';

export const signOperatorToken = (c: Omit<OperatorClaims, 'typ'>): string =>
  jwt.sign({ typ: 'operator', ...c }, appConfig.jwtSecret, { expiresIn: OPERATOR_TOKEN_TTL });

// PIN de 4 a 8 dígitos, sin repetidos ni escaleras fáciles (0000, 1234, 9876…).
export const isWeakPin = (pin: string): boolean => {
  if (!/^\d{4,8}$/.test(pin)) return true;
  if (/^(\d)\1+$/.test(pin)) return true;
  const d = [...pin].map(Number);
  const step = d[1] - d[0];
  return Math.abs(step) === 1 && d.every((x, i) => i === 0 || x - d[i - 1] === step);
};

/**
 * Si llega el token de operario lo valida (mismo taller, operario activo) y deja `req.operator`.
 * Sin token no hace nada: quien decide si el PIN es obligatorio es `requireOperatorIfAny`.
 */
export const readOperator = async (req: Request, res: Response, next: NextFunction) => {
  const raw = req.header(OPERATOR_HEADER);
  if (!raw) return next();
  try {
    const c = jwt.verify(raw, appConfig.jwtSecret) as Partial<OperatorClaims>;
    if (c.typ !== 'operator' || c.tenantId !== req.tenantId) throw new Error('claims');
    const op = await Operator.findOne({ _id: c.id, tenantId: req.tenantId, active: true }).select('name').lean();
    if (!op) throw new Error('operario inactivo');
    req.operator = { id: String(op._id), name: op.name };
    next();
  } catch {
    res.status(401).json({ message: 'Identificación de operario inválida o vencida. Ingresá tu PIN de nuevo.', code: 'OPERATOR_TOKEN_INVALID' });
  }
};

/** Si el taller tiene operarios activos, el personal (staff) debe identificarse con PIN; el admin no. */
export const requireOperatorIfAny = async (req: Request, res: Response, next: NextFunction) => {
  if (req.operator || req.user?.role === 'admin') return next();
  const any = await Operator.exists({ tenantId: req.tenantId, active: true });
  if (!any) return next();
  res.status(403).json({ message: 'Ingresá tu PIN de operario para avanzar piezas.', code: 'PIN_REQUIRED' });
};
