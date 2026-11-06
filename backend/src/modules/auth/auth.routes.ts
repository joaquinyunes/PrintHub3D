import { Router } from 'express';
import { login, getMe, refreshToken as refresh, register, verifyEmail, logout, logoutAll } from './auth.controller';
import twoFactorRoutes from './two-factor.routes';
import { forgotPassword, resetPassword } from './forgot-reset.password';
import { protect, loginValidations, validateRequest, registerValidations } from './auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginValidations, validateRequest, login);
router.post('/register', authLimiter, registerValidations, validateRequest, register);
router.post('/verify-email', authLimiter, verifyEmail);

router.get('/test', (req, res) => res.json({ status: 'ok' }));
router.get('/me', protect, getMe);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);
router.use('/2fa', twoFactorRoutes);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

export default router;
