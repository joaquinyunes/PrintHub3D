import { Router } from 'express';
import { getClients, updateClient } from './client.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Listado de clientes: datos sensibles del CRM → solo personal interno
router.get('/', protect, withTenant, adminOnly, getClients);
router.put('/:id', protect, withTenant, adminOnly, updateClient);

export default router;