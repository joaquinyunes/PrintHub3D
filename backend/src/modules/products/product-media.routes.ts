import { Router } from 'express';
import { uploadProductImage } from './product-media.controller';
import { protect } from '../auth/auth.middleware';

const router = Router();
// Teóricamente protegido; ajuste según tus roles (admin/client)
router.post('/image', protect, uploadProductImage);

export default router;
