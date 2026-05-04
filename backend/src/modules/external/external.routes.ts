import { Router, Request, Response } from 'express';
import { apiKeyAuth, requireScope } from '../../middleware/apiKeyAuth';
import Order from '../orders/order.model';
import Product from '../products/product.model';

const router = Router();

// Todas las rutas requieren API Key
router.use(apiKeyAuth as any);

// Crear orden desde sistema externo (TiendaNube, Shopify, etc.)
router.post('/orders', requireScope('orders:write'), async (req: any, res) => {
  try {
    const { clientName, items, total, notes, customerContact } = req.body;
    const tenantId = req.tenantId;

    if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Datos de orden incompletos' });
    }

    // Generar código de tracking
    const trackingCode = `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const order = new Order({
      clientName,
      items: items.map((item: any) => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        isCustom: false,
      })),
      total: total || items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0),
      notes: notes || 'Orden externa',
      customerContact,
      trackingCode,
      status: 'pending',
      origin: 'external_api',
      tenantId,
    });

    await order.save();

    res.status(201).json({
      message: 'Orden creada',
      orderId: order._id,
      trackingCode: order.trackingCode,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creando orden externa' });
  }
});

// Obtener productos públicos para tienda externa
router.get('/products', requireScope('products:read'), async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const { inStock } = req.query;

    const filter: any = { tenantId, isPublic: true };
    if (inStock === 'true') filter.stock = { $gt: 0 };

    const products = await Product.find(filter).select('-__v').lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo productos' });
  }
});

export default router;
