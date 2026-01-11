import { Router } from 'express';
import { getPrinters, createPrinter, deletePrinter } from './printer.controller';

const router = Router();

router.get('/', getPrinters);
router.post('/', createPrinter);
router.delete('/:id', deletePrinter);

export default router;