import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../config';
import logger from '../../config/logger';
import { body, validationResult } from 'express-validator';

// 1. Verificar que esté logueado (Cualquiera)
export const protect = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No autorizado' });

    try {
        const decoded = jwt.verify(token, appConfig.jwtSecret) as any;
        (req as any).user = decoded; 
        next();
    } catch (error) {
        logger.warn('Token inválido o expirado', { token: token.substring(0, 10) + '...' });
        res.status(401).json({ message: 'Token inválido' });
    }
};

// 2. Verificar que sea ADMIN (Solo el jefe)
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user && (req as any).user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requiere ser Admin.' });
    }
};

// Validators para autenticación
export const registerValidations = [
  body('name').isLength({ min: 2 }).withMessage('Nombre requerido (mín 2 caracteres)'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
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
