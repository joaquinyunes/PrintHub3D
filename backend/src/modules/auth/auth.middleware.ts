import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// 1. Verificar que esté logueado (Cualquiera)
export const protect = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No autorizado' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        // @ts-ignore
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// 2. Verificar que sea ADMIN (Solo el jefe)
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requiere ser Admin.' });
    }
};