import { Router } from 'express';
import { register, login, getMe, refreshToken as refresh, verifyEmail } from './auth.controller';
import { forgotPassword, resetPassword } from './forgot-reset.password';
import { googleAuthRedirect, googleAuthCallback, googleAuthToken } from './google-auth.controller';
import { protect, adminOnly, registerValidations, loginValidations, validateRequest } from './auth.middleware';

const router = Router();

router.post('/register', registerValidations, validateRequest, register);
router.post('/login', loginValidations, validateRequest, login);
router.get('/me', protect, getMe);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Google OAuth
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);
router.post('/google/token', googleAuthToken);

export default router;
