import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model';
import RefreshToken from '../../models/refreshToken.model';
import { appConfig } from '../../config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../config/email';
import crypto from 'crypto';
import logger from '../../config/logger';

// --- REGISTRO PÚBLICO (Solo crea CLIENTES) ---
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email ya registrado' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'client',
            tenantId: appConfig.defaultTenantId
        });

        // Generar token de verificación
        newUser.verificationToken = crypto.randomBytes(20).toString('hex');
        newUser.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        newUser.verified = false;
        await newUser.save();

        // Enviar email de verificación
        try {
            await sendVerificationEmail(email, newUser.verificationToken, name);
        } catch (emailError) {
            logger.warn(`No se pudo enviar email de verificación a ${email}:`, emailError);
        }

        logger.info(`Nuevo usuario registrado (pendiente verificación): ${email}`);
        res.status(201).json({ 
            message: 'Registro exitoso. Por favor, verifica tu email para activar tu cuenta.',
            email: email
        }); 

    } catch (error: any) {
        logger.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en registro' });
    }
};

// --- LOGIN (Para Admin y Clientes) ---
export const login = async (req: Request, res: Response) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);
        const { email, password } = req.body;

        const user = await User.findOne({ email }) as any;
        if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

        // Verificar si la cuenta está bloqueada
        if (user.lockUntil && user.lockUntil > new Date()) {
            return res.status(403).json({ 
                message: `Cuenta bloqueada. Intenta nuevamente después de ${user.lockUntil.toLocaleTimeString()}` 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        if (!isMatch) {
            // Incrementar intentos fallidos
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            
            // Bloquear cuenta después de 5 intentos fallidos
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
                await user.save();
                return res.status(403).json({ 
                    message: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' 
                });
            }
            
            await user.save();
            return res.status(400).json({ 
                message: 'Contraseña incorrecta',
                attemptsRemaining: 5 - user.loginAttempts
            });
        }

        // Resetear intentos fallidos en login exitoso
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        // Verificar si el email está verificado (solo para clientes, no admins)
        if (!user.verified && user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Por favor, verifica tu email antes de iniciar sesión.',
                needsVerification: true,
                email: user.email
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role, tenantId: user.tenantId }, appConfig.jwtSecret, { expiresIn: '30d' });
        const refresh = await generateRefreshToken(user._id.toString());

        logger.info(`Login exitoso: ${email}`);
        res.json({ 
            token, 
            refreshToken: refresh.token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                tenantId: user.tenantId
            } 
        });

    } catch (error: any) {
        logger.error('Error en login:', error);
        const detail = process.env.NODE_ENV !== 'production' ? (error?.message ?? String(error)) : undefined;
        res.status(500).json({ message: 'Error en login' + (detail ? `: ${detail}` : '') });
    }
};

// --- GET ME (Obtener usuario actual desde token) ---
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });
        
        res.json({ 
            user: { 
                id: user.id, 
                name: user.name || 'Usuario', 
                email: user.email || '', 
                role: user.role,
                tenantId: user.tenantId
            } 
        });
    } catch (error) {
        logger.error('Error obteniendo usuario:', error);
        res.status(500).json({ message: 'Error obteniendo usuario' });
    }
};

// Helper: generar refresh token y guardarlo
const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  const rt = new RefreshToken({ userId, token, expiresAt });
  await rt.save();
  return { token: rt.token, expiresAt: rt.expiresAt };
};

// Endpoint para refrescar tokens
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Refresh token requerido' });
    
    const rt = await RefreshToken.findOne({ token });
    if (!rt || rt.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Refresh token inválido o expirado' });
    }
    
    const user = await User.findById(rt.userId) as any;
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const newToken = jwt.sign({ id: user._id, role: user.role, tenantId: user.tenantId }, appConfig.jwtSecret, { expiresIn: '30d' });
    
    // Rotación de refresh token
    await rt.deleteOne();
    const newRt = await generateRefreshToken(user._id.toString());
    
    logger.info(`Token refrescado para usuario: ${user.email}`);
    res.json({ 
        token: newToken, 
        refreshToken: newRt.token, 
        user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } 
    });
  } catch (err) {
    logger.error('Error en refreshToken:', err);
    res.status(500).json({ message: 'Error renovando sesión' });
  }
};

// --- VERIFICAR EMAIL ---
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        
        if (!token) return res.status(400).json({ message: 'Token de verificación requerido' });

        const user = await User.findOne({ 
            verificationToken: token,
            verificationExpires: { $gt: new Date() }
        }) as any;

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        user.verified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        // Generar token JWT después de verificar
        const jwtToken = jwt.sign({ id: user._id, role: user.role, tenantId: user.tenantId }, appConfig.jwtSecret, { expiresIn: '30d' });
        const refresh = await generateRefreshToken(user._id.toString());

        logger.info(`Email verificado exitosamente: ${user.email}`);
        res.json({ 
            message: 'Email verificado exitosamente',
            token: jwtToken,
            refreshToken: refresh.token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                tenantId: user.tenantId
            }
        });

    } catch (error: any) {
        logger.error('Error en verificación de email:', error);
        res.status(500).json({ message: 'Error verificando email' });
    }
};

// --- SOLICITAR RECUPERACIÓN DE CONTRASEÑA ---
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        if (!email) return res.status(400).json({ message: 'Email requerido' });

        const user = await User.findOne({ email }) as any;
        
        // Por seguridad, siempre devolvemos el mismo mensaje
        if (!user) {
            return res.json({ 
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' 
            });
        }

        // Generar token de recuperación
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora
        await user.save();

        // Enviar email
        try {
            await sendPasswordResetEmail(email, resetToken, user.name);
        } catch (emailError) {
            logger.warn(`No se pudo enviar email de recuperación a ${email}:`, emailError);
        }

        logger.info(`Solicitud de recuperación de contraseña para: ${email}`);
        res.json({ 
            message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' 
        });

    } catch (error: any) {
        logger.error('Error en forgotPassword:', error);
        res.status(500).json({ message: 'Error procesando la solicitud' });
    }
};

// --- RESTABLECER CONTRASEÑA ---
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const user = await User.findOne({ 
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        }) as any;

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        // Actualizar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        logger.info(`Contraseña restablecida para: ${user.email}`);
        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error: any) {
        logger.error('Error en resetPassword:', error);
        res.status(500).json({ message: 'Error restableciendo contraseña' });
    }
};
