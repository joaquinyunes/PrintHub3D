import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import Operator from './operator.model';
import { isWeakPin, signOperatorToken } from './operator.auth';
import { protect, adminOnly, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { zodValidator } from '../../middleware/zodValidator';
import { pinLimiter } from '../../middlewares/rateLimiter';
import { audit } from '../audit/audit.service';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 10;

const pinField = z.string().refine((p) => !isWeakPin(p), 'PIN de 4 a 8 dígitos, sin repetidos ni escaleras (1234, 0000)');
const CreateSchema = z.object({ name: z.string().trim().min(2).max(60), pin: pinField });
const UpdateSchema = z.object({ name: z.string().trim().min(2).max(60).optional(), active: z.boolean().optional(), pin: pinField.optional() });
const LoginSchema = z.object({ operatorId: z.string().min(1).max(40), pin: z.string().min(1).max(20) });

const router = Router();
router.use(protect, withTenant, staffOrAdmin);

const publicOp = (o: any) => ({ id: String(o._id), name: o.name, active: o.active, locked: !!(o.lockUntil && o.lockUntil > new Date()) });

// Lista para la pantalla de PIN (solo activos para el personal; el admin ve todos con ?all=1).
router.get('/', async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { tenantId: req.tenantId };
  if (req.user?.role !== 'admin' || req.query.all !== '1') filter.active = true;
  res.json({ items: (await Operator.find(filter).sort({ name: 1 }).lean()).map(publicOp) });
});

router.post('/', adminOnly, zodValidator({ body: CreateSchema }), async (req: Request, res: Response) => {
  const { name, pin } = req.body;
  if (await Operator.exists({ tenantId: req.tenantId, name })) return res.status(409).json({ message: 'Ya hay un operario con ese nombre.' });
  const op = await Operator.create({ tenantId: req.tenantId, name, pinHash: await bcrypt.hash(pin, BCRYPT_ROUNDS) });
  await audit(req, 'operator.create', String(op._id), { name });
  res.status(201).json(publicOp(op));
});

router.patch('/:id', adminOnly, zodValidator({ body: UpdateSchema }), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const op = mongoose.isValidObjectId(id) ? await Operator.findOne({ _id: id, tenantId: req.tenantId }).select('+pinHash') : null;
  if (!op) return res.status(404).json({ message: 'Operario no encontrado.' });
  const { name, active, pin } = req.body;
  if (name !== undefined) op.name = name;
  if (active !== undefined) op.active = active;
  if (pin !== undefined) {
    op.pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    op.failedAttempts = 0;
    op.lockUntil = null;
  }
  try {
    await op.save();
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'Ya hay un operario con ese nombre.' });
    throw e;
  }
  await audit(req, 'operator.update', id, { name, active, pinChanged: pin !== undefined });
  res.json(publicOp(op));
});

// Identificarse con PIN → token de operario (12 h) que va en `x-operator-token`.
router.post('/login', pinLimiter, zodValidator({ body: LoginSchema }), async (req: Request, res: Response) => {
  const { operatorId, pin } = req.body;
  // 403 y no 401: el 401 del front significa "sesión vencida" y manda al login.
  const fail = () => res.status(403).json({ message: 'Operario o PIN incorrecto.', code: 'PIN_INVALID' });
  if (!mongoose.isValidObjectId(operatorId)) return fail();
  // Siempre dentro del taller de la sesión: un operario de otro taller es "no existe".
  const op = await Operator.findOne({ _id: operatorId, tenantId: req.tenantId, active: true }).select('+pinHash');
  if (!op) return fail();
  if (op.lockUntil && op.lockUntil > new Date()) {
    const mins = Math.ceil((op.lockUntil.getTime() - Date.now()) / 60000);
    return res.status(423).json({ message: `Operario bloqueado por intentos fallidos. Probá en ${mins} min o pedile al admin que cambie el PIN.`, code: 'LOCKED' });
  }
  if (!(await bcrypt.compare(pin, op.pinHash))) {
    // $inc atómico: dos intentos simultáneos no se pisan el contador.
    const upd = await Operator.findOneAndUpdate({ _id: op._id }, { $inc: { failedAttempts: 1 } }, { returnDocument: 'after' });
    if (upd && upd.failedAttempts >= MAX_ATTEMPTS) {
      await Operator.updateOne({ _id: op._id }, { $set: { failedAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } });
      await audit(req, 'operator.locked', String(op._id), { name: op.name });
      return res.status(423).json({ message: `Demasiados intentos. Operario bloqueado ${LOCK_MINUTES} min.`, code: 'LOCKED' });
    }
    return fail();
  }
  await Operator.updateOne({ _id: op._id }, { $set: { failedAttempts: 0, lockUntil: null, lastLoginAt: new Date() } });
  res.json({ token: signOperatorToken({ id: String(op._id), name: op.name, tenantId: String(req.tenantId) }), operator: { id: String(op._id), name: op.name } });
});

export default router;
