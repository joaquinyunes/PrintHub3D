import { Router, Request, Response } from 'express';
import Expense from './expense.model';
import { protect } from '../auth/auth.middleware';

const router = Router();

// 1. Crear un Gasto
router.post('/', protect, async (req: Request, res: Response) => {
    try {
        const { description, amount, category, date } = req.body;
        // @ts-ignore
        const tenantId = req.user.tenantId;

        const newExpense = new Expense({
            description,
            amount,
            category,
            date: date || new Date(),
            tenantId
        });

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: 'Error creando gasto' });
    }
});

// 2. Obtener Gastos (del mes actual por defecto o todos)
router.get('/', protect, async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const tenantId = req.user.tenantId;
        const expenses = await Expense.find({ tenantId }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo gastos' });
    }
});

// 3. Eliminar Gasto
router.delete('/:id', protect, async (req: Request, res: Response) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando gasto' });
    }
});

export default router;