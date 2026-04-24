import { Router } from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    deleteTask 
} from './task.controller';
import { protect } from '../auth/auth.middleware';

const router = Router();

// Todas las rutas requieren estar logueado
router.use(protect);

// Obtener todas las tareas y Crear una nueva
router.route('/')
    .get(getTasks)
    .post(createTask);

// Modificar (completar) y Borrar por ID
router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

export default router;