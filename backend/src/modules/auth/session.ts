import jwt from 'jsonwebtoken';
import { appConfig } from '../../config';

/** Sesión del panel: un solo lugar arma el token (nombre para auditoría + versión para "cerrar en todos los dispositivos"). */
export const signSession = (user: { _id: unknown; role: string; tenantId: string; name?: string; tokenVersion?: number }): string =>
  jwt.sign(
    { id: String(user._id), role: user.role, tenantId: user.tenantId, name: user.name ?? '', tv: user.tokenVersion ?? 0 },
    appConfig.jwtSecret,
    { expiresIn: appConfig.jwtExpiresIn as any },
  );
