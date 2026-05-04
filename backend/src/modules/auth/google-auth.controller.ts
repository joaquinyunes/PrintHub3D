import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from './user.model';
import RefreshToken from '../../models/refreshToken.model';
import { appConfig } from '../../config';
import logger from '../../config/logger';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  appConfig.google.clientId,
  appConfig.google.clientSecret,
  `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
);

// Paso 1: Redirigir a Google
export const googleAuthRedirect = (req: Request, res: Response) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
};

// Paso 2: Callback de Google
export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }

    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }

    const { email, name, picture } = payload;

    // Buscar o crear usuario
    let user = await User.findOne({ email });

    if (!user) {
      // Crear nuevo usuario (cliente por defecto)
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'), // Password aleatorio
        role: 'client',
        tenantId: appConfig.defaultTenantId,
        verified: true, // Email verificado por Google
        avatar: picture,
      });
      await user.save();
      logger.info(`Nuevo usuario via Google OAuth: ${email}`);
    } else {
      // Actualizar avatar si no tiene
      if (picture && !user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    // Generar JWT y Refresh Token
    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenantId },
      appConfig.jwtSecret,
      { expiresIn: '30d' },
    );

    const refreshToken = await generateRefreshToken(user._id.toString());

    // Redirigir al frontend con el token
    const redirectUrl = new URL(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('refreshToken', refreshToken.token);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }));

    res.redirect(redirectUrl.toString());
  } catch (error: any) {
    logger.error('Error en Google OAuth callback:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
  }
};

// Login con Google Token (para frontend que usa Google Sign-In)
export const googleAuthToken = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Credential requerido' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Token de Google inválido' });
    }

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'client',
        tenantId: appConfig.defaultTenantId,
        verified: true,
        avatar: picture,
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenantId },
      appConfig.jwtSecret,
      { expiresIn: '30d' },
    );

    const refresh = await generateRefreshToken(user._id.toString());

    res.json({
      token,
      refreshToken: refresh.token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error: any) {
    logger.error('Error en Google token auth:', error);
    res.status(500).json({ message: 'Error autenticando con Google' });
  }
};

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const rt = new RefreshToken({ userId, token, expiresAt });
  await rt.save();
  return { token: rt.token, expiresAt: rt.expiresAt };
};
