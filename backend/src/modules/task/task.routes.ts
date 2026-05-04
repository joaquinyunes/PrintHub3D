import { Router } from 'express';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from './task.controller';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticación y tenant
router.use(protect, withTenant, adminOnly);

// Obtener todas las tareas y Crear una nueva
router.route('/')
    .get(getTasks)
    .post(createTask);

// Modificar (completar) y Borrar por ID
router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

export default router;