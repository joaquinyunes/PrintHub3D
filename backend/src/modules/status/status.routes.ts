import { Router } from 'express';
import { healthCheck } from './status.controller';

const router = Router();

// Simple health endpoint
router.get('/health', healthCheck);

export default router;
