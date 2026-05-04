import { Router } from 'express';
import { login, getMe, refreshToken as refresh } from './auth.controller';
import { forgotPassword, resetPassword } from './forgot-reset.password';
import { protect, loginValidations, validateRequest } from './auth.middleware';

const router = Router();

// Solo login habilitado - El registro se hace vía seedAdmin.ts
router.post('/login', loginValidations, validateRequest, login);
router.get('/me', protect, getMe);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
