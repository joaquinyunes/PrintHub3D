import { Response } from 'express';
import { appConfig } from '../config';

const baseOpts = () => ({
  httpOnly: true,
  secure: appConfig.isProduction,
  sameSite: (appConfig.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  domain: appConfig.cookieDomain,
  path: '/',
});

/**
 * Setea las cookies httpOnly de sesión. Se envían ADEMÁS del token en el body
 * durante la transición: el frontend puede migrar a cookies sin romper nada.
 */
export const setAuthCookies = (res: Response, token: string, refreshToken?: string) => {
  res.cookie('token', token, { ...baseOpts(), maxAge: 30 * 24 * 60 * 60 * 1000 });
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, { ...baseOpts(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('token', baseOpts());
  res.clearCookie('refreshToken', baseOpts());
};
