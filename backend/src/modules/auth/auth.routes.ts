import { Router } from 'express';
import { login, getMe, refreshToken as refresh, register } from './auth.controller';
import { forgotPassword, resetPassword } from './forgot-reset.password';
import { protect, loginValidations, validateRequest, registerValidations } from './auth.middleware';

const router = Router();

// Login y registro (sin validaciones temporalmente)
router.post('/login', login);
router.post('/register', registerValidations, validateRequest, register);

// Endpoint de test
router.get('/test', (req, res) => res.json({ status: 'ok' }));
router.get('/me', protect, getMe);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
