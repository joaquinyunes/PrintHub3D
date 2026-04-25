import { Router } from 'express';
import homeCtrl from './home.controller';
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

// Ideas
router.get('/ideas', homeCtrl.getIdeas);
router.post('/ideas', protect, adminOnly, homeCtrl.createIdea);
router.put('/ideas/:id', protect, adminOnly, homeCtrl.updateIdea);
router.delete('/ideas/:id', protect, adminOnly, homeCtrl.deleteIdea);

// Printers
router.get('/printers', homeCtrl.getPrinters);
router.post('/printers', protect, adminOnly, homeCtrl.createPrinter);
router.put('/printers/:id', protect, adminOnly, homeCtrl.updatePrinter);
router.delete('/printers/:id', protect, adminOnly, homeCtrl.deletePrinter);

export default router;
