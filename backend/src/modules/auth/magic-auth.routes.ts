import { Router } from 'express';
import { magicLimiter } from '../../middlewares/rateLimiter';
import { requestMagicCode, verifyMagicCode } from './magic-auth.controller';

const router = Router();

router.post('/magic/request', magicLimiter, requestMagicCode);
router.post('/magic/verify', magicLimiter, verifyMagicCode);

export default router;