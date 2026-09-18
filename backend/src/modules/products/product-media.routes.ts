import { Router } from 'express';
import { uploadProductImage } from './product-media.controller';
import { protect, staffOrAdmin } from '../auth/auth.middleware';

const router = Router();
router.post('/image', protect, staffOrAdmin, uploadProductImage);

export default router;
