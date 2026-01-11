import { Router } from 'express';
import { getClients } from './client.controller';

const router = Router();
router.get('/', getClients);

export default router;