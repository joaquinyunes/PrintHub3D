import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from './user.model';
import { protect } from './auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter';
import { newSecret, otpauthUri, verifyTotp } from '../../utils/totp';
import { withTenant } from '../../middleware/tenant.middleware';
import { audit } from '../audit/audit.service';

// 2FA (TOTP) del panel. El secreto queda en la base con `select: false` (nunca sale en una respuesta de usuario).
const router = Router();
router.use(protect, withTenant, authLimiter);

router.post('/setup', async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('+totpSecret email totpEnabled');
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (user.totpEnabled) return res.status(409).json({ message: 'La verificación en dos pasos ya está activa.' });
  user.totpSecret = newSecret();
  await user.save();
  res.json({ secret: user.totpSecret, otpauthUrl: otpauthUri(user.totpSecret, user.email) });
});

router.post('/enable', async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('+totpSecret totpEnabled');
  if (!user?.totpSecret) return res.status(400).json({ message: 'Primero generá el secreto (setup).' });
  if (!verifyTotp(user.totpSecret, String(req.body?.code ?? ''))) return res.status(400).json({ message: 'Código incorrecto.' });
  user.totpEnabled = true;
  await user.save();
  await audit(req, '2fa.enable', String(user._id));
  res.json({ message: 'Verificación en dos pasos activada.' });
});

router.post('/disable', async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('+totpSecret +password totpEnabled');
  if (!user?.totpEnabled || !user.totpSecret) return res.status(400).json({ message: 'La verificación en dos pasos no está activa.' });
  const passwordOk = await bcrypt.compare(String(req.body?.password ?? ''), user.password).catch(() => false);
  if (!passwordOk || !verifyTotp(user.totpSecret, String(req.body?.code ?? ''))) return res.status(400).json({ message: 'Contraseña o código incorrectos.' });
  user.totpEnabled = false;
  user.totpSecret = undefined;
  await user.save();
  await audit(req, '2fa.disable', String(user._id));
  res.json({ message: 'Verificación en dos pasos desactivada.' });
});

export default router;
