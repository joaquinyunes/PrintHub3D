import { Router } from 'express';
import {
  getPrinters,
  createPrinter,
  deletePrinter,
  updatePrinterStatus,
  updatePrinterIntegration,
  getPrinterLive,
} from './printer.controller';
import { protect, staffOrAdmin } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Gestión de impresoras: inventario interno y producción → solo staff autorizado
router.get('/', protect, withTenant, staffOrAdmin, getPrinters);
router.post('/', protect, withTenant, staffOrAdmin, createPrinter);
router.delete('/:id', protect, withTenant, staffOrAdmin, deletePrinter);
router.patch('/:id/status', protect, withTenant, staffOrAdmin, updatePrinterStatus);
router.patch('/:id/integration', protect, withTenant, staffOrAdmin, updatePrinterIntegration);
router.get('/:id/live', protect, withTenant, staffOrAdmin, getPrinterLive);

export default router;
