import { Router } from 'express';
import InventoryMovement from './inventory-movement.model';
import { protect, adminOnly } from '../auth/auth.middleware';

const router = Router();

// Obtener log de movimientos de inventario
router.get('/movements', protect, adminOnly, async (req: any, res) => {
  try {
    const { productId, type, from, to, page = 1, limit = 50 } = req.query;
    const tenantId = req.user.tenantId;

    const filter: any = { tenantId };
    if (productId) filter.productId = productId;
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InventoryMovement.countDocuments(filter),
    ]);

    res.json({
      movements,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error obteniendo movimientos' });
  }
});

// Obtener resumen de un producto
router.get('/movements/product/:productId', protect, adminOnly, async (req: any, res) => {
  try {
    const { productId } = req.params;
    const tenantId = req.user.tenantId;

    const movements = await InventoryMovement.find({ tenantId, productId })
      .sort({ createdAt: -1 })
      .lean();

    const summary = movements.reduce(
      (acc, m) => {
        if (['sale', 'adjustment_remove', 'order_consumption'].includes(m.type)) {
          acc.totalOut += m.quantity;
        } else {
          acc.totalIn += m.quantity;
        }
        return acc;
      },
      { totalIn: 0, totalOut: 0 },
    );

    res.json({ productId, movements, summary });
  } catch (error: any) {
    res.status(500).json({ message: 'Error obteniendo movimientos' });
  }
});

export default router;
