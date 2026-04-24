import { Router } from 'express';
// Importamos el controlador que está al lado
import { register, login } from './auth.controller'; 
import { protect, adminOnly } from './auth.middleware';
// Importaremos el middleware luego, por ahora dejamos getMe comentado o abierto
// import { protect } from './auth.middleware'; 

const router = Router();

router.post('/register', register);
router.post('/login', login);
// router.get('/me', protect, getMe); // Lo activaremos en el próximo paso

export default router;