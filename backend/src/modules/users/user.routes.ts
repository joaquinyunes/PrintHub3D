import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../auth/user.model';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';
import { reqParam } from '../../utils/reqParam';
import logger from '../../config/logger';

const router = Router();

const PANEL_ROLES = ['admin', 'staff'];
const panelRoleFilter = { $in: PANEL_ROLES } as any;
const publicUser = (u: any) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active !== false,
  createdAt: u.createdAt,
});

// Listar usuarios del panel (admin + staff)
router.get('/', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  const users = await User.find({ tenantId: req.tenantId, role: panelRoleFilter })
    .select('name email role active createdAt')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ items: users.map(publicUser) });
});

// Crear usuario del panel
router.post('/', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Nombre y email son obligatorios' });
    if (!PANEL_ROLES.includes(role)) return res.status(400).json({ message: 'Rol inválido (admin | staff)' });

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Ya existe un usuario con ese email' });

    const plain = password && String(password).length >= 8 ? String(password) : crypto.randomBytes(9).toString('base64url');
    const hashed = await bcrypt.hash(plain, await bcrypt.genSalt(10));

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      role,
      password: hashed,
      verified: true,
      active: true,
      tenantId: req.tenantId,
    });

    logger.info(`Usuario de panel creado: ${user.email} (${role})`);
    res.status(201).json({ ...publicUser(user), tempPassword: password ? undefined : plain });
  } catch (error) {
    logger.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

// Actualizar (rol / nombre / activo / reset de contraseña)
router.patch('/:id', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  try {
    const id = reqParam(req, 'id');
    const target = await User.findOne({ _id: id, tenantId: req.tenantId });
    if (!target) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (typeof req.body.name === 'string') target.name = req.body.name.trim();
    if (PANEL_ROLES.includes(req.body.role)) target.role = req.body.role;
    if (typeof req.body.active === 'boolean') target.active = req.body.active;

    // No permitir que el admin se quite a sí mismo el rol o se desactive
    if (String(target._id) === String(req.user.id) && (target.role !== 'admin' || target.active === false)) {
      return res.status(400).json({ message: 'No podés quitarte tu propio acceso de admin' });
    }

    let tempPassword: string | undefined;
    if (req.body.resetPassword) {
      tempPassword = crypto.randomBytes(9).toString('base64url');
      target.password = await bcrypt.hash(tempPassword, await bcrypt.genSalt(10));
      (target as any).loginAttempts = 0;
      (target as any).lockUntil = undefined;
    }

    await target.save();
    res.json({ ...publicUser(target), tempPassword });
  } catch (error) {
    logger.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

router.delete('/:id', protect, withTenant, adminOnly, async (req: any, res: Response) => {
  const id = reqParam(req, 'id');
  if (String(id) === String(req.user.id)) return res.status(400).json({ message: 'No podés eliminarte a vos mismo' });
  const deleted = await User.findOneAndDelete({ _id: id, tenantId: req.tenantId, role: panelRoleFilter });
  if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado' });
});

export default router;
