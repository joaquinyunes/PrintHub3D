import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from './user.model';
import { appConfig } from '../../config';
import logger from '../../config/logger';

export const requestMagicCode = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Email o teléfono requerido' });

    let user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    }) as (IUser & { phone?: string; email?: string }) | null;

    if (!user) {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(tempPassword, 10);
      
      user = new User({
        name: identifier.split('@')[0],
        email: identifier.includes('@') ? identifier : undefined,
        phone: !identifier.includes('@') ? identifier : undefined,
        password: hashedPassword,
        role: 'client',
        tenantId: appConfig.defaultTenantId,
      }) as IUser & { phone?: string; email?: string };
    }

    if ((user as any).role === 'admin') {
      return res.status(400).json({ message: 'Los administradores deben usar contraseña' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    (user as any).magicCode = code;
    (user as any).magicCodeExpires = expiresAt;
    await user.save();

    const userPhone = (user as any).phone as string | undefined;
    
    if (userPhone) {
      try {
        const { sendCustomerNotification } = await import('../notifications/notification.service');
        await sendCustomerNotification(
          userPhone,
          `🔐 Tu código de acceso es: *${code}*. Expira en 15 minutos.`
        );
      } catch (err) {
        logger.error('Error enviando código:', err);
      }
    }

    logger.info(`Magic code generado para ${identifier}: ${code}`);
    
    res.json({ 
      message: 'Código enviado',
      sentTo: userPhone ? 'whatsapp' : 'email',
      expiresInMinutes: 15
    });

  } catch (error) {
    logger.error('Error requestMagicCode:', error);
    res.status(500).json({ message: 'Error solicitando código' });
  }
};

export const verifyMagicCode = async (req: Request, res: Response) => {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({ message: 'Identificador y código requeridos' });
    }

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }],
      magicCode: code,
      magicCodeExpires: { $gt: new Date() }
    }) as (IUser & { phone?: string; email?: string }) | null;

    if (!user) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // Limpiar código
    (user as any).magicCode = undefined;
    (user as any).magicCodeExpires = undefined;
    await user.save();

    const token = jwt.sign({ 
      id: user._id, 
      role: (user as any).role,
      tenantId: (user as any).tenantId 
    }, appConfig.jwtSecret, { expiresIn: '30d' });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: (user as any).email, 
        role: (user as any).role 
      } 
    });

  } catch (error) {
    logger.error('Error verifyMagicCode:', error);
    res.status(500).json({ message: 'Error verificando código' });
  }
};
