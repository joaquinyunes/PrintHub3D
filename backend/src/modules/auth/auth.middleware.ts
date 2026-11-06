import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../config';
import logger from '../../config/logger';
import { AppError } from '../../utils/AppError';
import { body, validationResult } from 'express-validator';
import User from './user.model';

export type UserRole = 'admin' | 'staff' | 'client';

/** Claims del JWT de sesión que `protect` deja en `req.user`. */
export interface AuthUser {
    id: string;
    role: UserRole;
    tenantId: string;
    /** Nombre para el registro de auditoría (los tokens viejos no lo traen). */
    name?: string;
    /** Versión de sesión: "cerrar sesión en todos los dispositivos" la sube. */
    tv?: number;
    typ?: string;
}

/** Usuario autenticado de la request. Solo para handlers que ya pasaron por `protect`. */
export const authUser = (req: Request): AuthUser => {
    if (!req.user) throw new AppError('No autorizado', 401);
    return req.user;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

// 1. Verificar que esté logueado (Cualquiera)
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const token =
        req.header('Authorization')?.replace('Bearer ', '') ||
        req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No autorizado' });

    try {
        const claims = jwt.verify(token, appConfig.jwtSecret) as AuthUser;
        // El token de PIN de operario identifica a una persona, no abre sesión.
        if (claims.typ === 'operator') return res.status(401).json({ message: 'Token inválido' });
        // "Cerrar sesión en todos los dispositivos": un token con versión vieja ya no vale.
        if (typeof claims.tv === 'number') {
            const u = await User.findById(claims.id).select('tokenVersion active').lean();
            if (!u || u.active === false || (u.tokenVersion ?? 0) !== claims.tv) {
                return res.status(401).json({ message: 'Sesión cerrada. Ingresá de nuevo.' });
            }
        }
        req.user = claims;
        next();
    } catch (error) {
        logger.warn('Token inválido o expirado', { token: token.substring(0, 10) + '...' });
        res.status(401).json({ message: 'Token inválido' });
    }
};

// 2. Verificar que sea ADMIN (Solo el jefe)
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requiere ser Admin.' });
    }
};

// 3. Permitir uno de varios roles (ej: operarios además del admin)
export const allowRoles = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (role && roles.includes(role)) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado para tu rol.' });
    }
};

// Operativo: admin o staff (operario). Los datos de caja/finanzas siguen siendo adminOnly.
export const staffOrAdmin = allowRoles('admin', 'staff');

// Validators para autenticación
export const registerValidations = [
  body('name').isLength({ min: 2 }).withMessage('Nombre requerido (mín 2 caracteres)'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
];

export const loginValidations = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').exists().withMessage('Contraseña requerida'),
];

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
