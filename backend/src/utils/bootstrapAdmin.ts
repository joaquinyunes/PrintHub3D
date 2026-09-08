import bcrypt from 'bcryptjs';
import User from '../modules/auth/user.model';
import { appConfig } from '../config';
import logger from '../config/logger';

/**
 * Crea o actualiza el usuario administrador a partir de ADMIN_EMAIL / ADMIN_PASSWORD.
 * Pensado para el primer arranque en producción. Una vez creado el admin, quitar
 * esas variables de entorno: si no están, esta función no hace nada.
 */
export const bootstrapAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return;
  if (password.length < 8) {
    logger.warn('bootstrapAdmin: ADMIN_PASSWORD demasiado corta, se omite');
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const existing = await User.findOne({ email });

    if (existing) {
      existing.password = hashed;
      existing.role = 'admin';
      existing.verified = true;
      existing.active = true;
      existing.loginAttempts = 0;
      existing.lockUntil = undefined;
      await existing.save();
      logger.info(`bootstrapAdmin: admin actualizado (${email})`);
    } else {
      await User.create({
        name: 'Administrador',
        email,
        password: hashed,
        role: 'admin',
        tenantId: appConfig.defaultTenantId,
        verified: true,
        active: true,
      });
      logger.info(`bootstrapAdmin: admin creado (${email})`);
    }
  } catch (err) {
    logger.error('bootstrapAdmin: error creando admin', err);
  }
};
