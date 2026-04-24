import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from './user.model';
import { appConfig } from '../../config';

const magicCodes = new Map<string, { code: string; expiresAt: Date; userId: string }>();

const generateMagicCode = () => Math.floor(100000 + Math.random() * 900000).toString();

setInterval(() => {
  const now = new Date();
  for (const [key, value] of magicCodes.entries()) {
    if (value.expiresAt < now) magicCodes.delete(key);
  }
}, 5 * 60 * 1000);

export const requestMagicCode = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Email o teléfono requerido' });
    }

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
      await user.save();
    }

    if ((user as any).role === 'admin') {
      return res.status(400).json({ message: 'Los administradores deben usar contraseña' });
    }

    const userPhone = (user as any).phone as string | undefined;
    
    const code = generateMagicCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    magicCodes.set(identifier, { code, expiresAt, userId: user._id.toString() });

    if (userPhone) {
      try {
        const { sendCustomerNotification } = await import('../notifications/notification.service');
        await sendCustomerNotification(
          userPhone,
          `🔐 Tu código de accesso es: *${code}*. Expira en 15 minutos.`
        );
      } catch (err) {
        console.error('Error enviando código:', err);
      }
    }

    res.json({ 
      message: 'Código enviado',
      sentTo: userPhone ? 'whatsapp' : 'email',
      expiresInMinutes: 15
    });

  } catch (error) {
    console.error('Error requestMagicCode:', error);
    res.status(500).json({ message: 'Error solicitando código' });
  }
};

export const verifyMagicCode = async (req: Request, res: Response) => {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({ message: 'Identificador y código requeridos' });
    }

    const stored = magicCodes.get(identifier);
    if (!stored) {
      return res.status(400).json({ message: 'Código no solicitado o expirado' });
    }

    if (stored.expiresAt < new Date()) {
      magicCodes.delete(identifier);
      return res.status(400).json({ message: 'Código expirado' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Código incorrecto' });
    }

    const user = await User.findById(stored.userId) as (IUser & { phone?: string; email?: string }) | null;
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    magicCodes.delete(identifier);

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
    console.error('Error verifyMagicCode:', error);
    res.status(500).json({ message: 'Error verificando código' });
  }
};