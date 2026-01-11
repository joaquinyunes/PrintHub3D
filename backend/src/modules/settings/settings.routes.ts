import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings); // Usamos PUT para actualizar

export default router;