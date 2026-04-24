import { Router } from 'express';
import { requestMagicCode, verifyMagicCode } from './magic-auth.controller';

const router = Router();

router.post('/magic/request', requestMagicCode);
router.post('/magic/verify', verifyMagicCode);

export default router;