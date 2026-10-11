import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiKeyAuth, requireScope } from '../../middleware/apiKeyAuth';
import { zodValidator } from '../../middleware/zodValidator';
import Order from '../orders/order.model';
import Product from '../products/product.model';
import logger from '../../config/logger';

const router = Router();

// Todas las rutas requieren API Key
router.use(apiKeyAuth);

const ExternalOrderSchema = z.object({
  clientName: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(10_000),
        price: z.number().min(0),
      }),
    )
    .min(1),
  total: z.number().min(0).optional(),
  notes: z.string().optional(),
  customerContact: z.string().optional(),
});

// Crear orden desde sistema externo (TiendaNube, Shopify, etc.)
router.post(
  '/orders',
  requireScope('orders:write'),
  zodValidator({ body: ExternalOrderSchema }),
  async (req: Request, res: Response) => {
    try {
      const { clientName, items, total, notes, customerContact } = req.body as z.infer<typeof ExternalOrderSchema>;

      // Generar código de tracking
      const trackingCode = `EXT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const order = new Order({
        clientName,
        items: items.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          isCustom: false,
        })),
        total: total ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        notes: notes || 'Orden externa',
        customerContact,
        trackingCode,
        status: 'pending',
        origin: 'external_api',
        tenantId: req.tenantId,
      });

      await order.save();

      res.status(201).json({
        message: 'Orden creada',
        orderId: order._id,
        trackingCode: order.trackingCode,
      });
    } catch (error) {
      logger.error({ msg: 'Error creando orden externa', err: (error as Error).message });
      res.status(500).json({ message: 'Error creando orden externa' });
    }
  },
);

// Obtener productos públicos para tienda externa
router.get('/products', requireScope('products:read'), async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = { tenantId: req.tenantId, isPublic: true };
    if (req.query.inStock === 'true') filter.stock = { $gt: 0 };

    const products = await Product.find(filter).select('-__v').lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo productos' });
  }
});

export default router;
