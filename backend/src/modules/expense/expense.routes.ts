import { Router, Request, Response } from 'express';
import Expense from './expense.model';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// 1. Crear un Gasto
router.post('/', protect, withTenant, adminOnly, async (req: Request, res: Response) => {
    try {
        const { description, amount, category, date } = req.body;
        const tenantId = (req as any).tenantId;

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

// 2. Obtener Gastos (del mes actual por defecto o todos) con paginación y filtros
router.get('/', protect, withTenant, adminOnly, async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const {
            page = '1',
            pageSize = '50',
            from,
            to,
            category,
        } = req.query as Record<string, string | undefined>;

        const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(pageSize || '50', 10) || 50, 1), 200);
        const skip = (pageNumber - 1) * limit;

        const query: any = { tenantId };

        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        if (category) {
            query.category = category;
        }

        const [items, total] = await Promise.all([
            Expense.find(query).sort({ date: -1 }).skip(skip).limit(limit),
            Expense.countDocuments(query),
        ]);

        res.json({
            items,
            total,
            page: pageNumber,
            pageSize: limit,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo gastos' });
    }
});

// 3. Eliminar Gasto
router.delete('/:id', protect, withTenant, adminOnly, async (req: Request, res: Response) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando gasto' });
    }
});

export default router;