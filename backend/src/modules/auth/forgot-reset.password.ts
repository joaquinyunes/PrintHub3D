import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model';
import { appConfig } from '../../config';
import logger from '../../config/logger';

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });

    const user = await User.findOne({ email });
    if (!user) {
      // No revelar si el usuario existe por seguridad
      return res.json({ message: 'Si el email existe, recibirás instrucciones.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    (user as any).passwordResetToken = hashedToken;
    (user as any).passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    // En producción, enviarías un email aquí con el enlace:
    // const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;
    logger.info(`Password reset token for ${email}: ${token}`);

    res.json({ message: 'Si el email existe, recibirás instrucciones.' });
  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error solicitando reseteo' });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Contraseña debe tener al menos 6 caracteres' });
    }

    const salt = await bcrypt.genSalt(10);
    (user as any).password = await bcrypt.hash(password, salt);
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for ${(user as any).email}`);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error reseteando contraseña' });
  }
};
