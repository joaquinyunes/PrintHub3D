import { Router } from 'express';
import { getPrinters, createPrinter, deletePrinter } from './printer.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Gestión de impresoras: inventario interno y producción → solo staff autorizado
router.get('/', protect, withTenant, adminOnly, getPrinters);
router.post('/', protect, withTenant, adminOnly, createPrinter);
router.delete('/:id', protect, withTenant, adminOnly, deletePrinter);

export default router;