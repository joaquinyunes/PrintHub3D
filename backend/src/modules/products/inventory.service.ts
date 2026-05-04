import Product from './product.model';
import Sale from '../sales/sale.model';
import InventoryMovement from '../inventory/inventory-movement.model';

interface BulkStockItem {
  name: string;
  quantity: number;
}

export const InventoryService = {
  async quickSell(tenantId: string, productId: string, userId?: string, userName?: string, orderId?: string) {
    const product = await Product.findOne({ _id: productId, tenantId });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (product.stock <= 0) {
      throw new Error('Sin stock');
    }

    const previousStock = product.stock;
    product.stock -= 1;
    await product.save();

    // Log de movimiento
    await new InventoryMovement({
      tenantId,
      productId: product._id,
      productName: product.name,
      type: orderId ? 'order_consumption' : 'sale',
      quantity: 1,
      previousStock,
      newStock: product.stock,
      unit: 'unidades',
      reason: orderId ? `Consumo por orden ${orderId}` : 'Venta rápida',
      userId,
      userName,
      orderId,
    }).save();

    const price = Number(product.price) || 0;
    const cost = Number(product.cost) || 0;
    const profit = price - cost;

    const newSale = new Sale({
      productId: product._id,
      productName: product.name,
      category: product.category,
      quantity: 1,
      price,
      cost,
      profit,
      tenantId,
      createdAt: new Date(),
    });

    await newSale.save();

    return { product, sale: newSale };
  },

  async bulkAddStock(tenantId: string, items: BulkStockItem[], userId?: string, userName?: string) {
    const results: Array<{ name: string; status: string; newStock: number }> =
      [];

    for (const item of items) {
      let product = await Product.findOne({
        name: { $regex: new RegExp(`^${item.name}$`, 'i') },
        tenantId,
      });

      if (product) {
        const previousStock = product.stock;
        product.stock += item.quantity;
        await product.save();

        await new InventoryMovement({
          tenantId,
          productId: product._id,
          productName: product.name,
          type: 'adjustment_add',
          quantity: item.quantity,
          previousStock,
          newStock: product.stock,
          unit: 'unidades',
          reason: 'Carga masiva de stock',
          userId,
          userName,
        }).save();

        results.push({
          name: item.name,
          status: 'Actualizado',
          newStock: product.stock,
        });
      } else {
        const newProduct = new Product({
          name: item.name,
          price: 0,
          cost: 0,
          stock: item.quantity,
          category: 'Filamento',
          tenantId,
        });
        await newProduct.save();

        await new InventoryMovement({
          tenantId,
          productId: newProduct._id,
          productName: newProduct.name,
          type: 'initial_stock',
          quantity: item.quantity,
          previousStock: 0,
          newStock: item.quantity,
          unit: 'unidades',
          reason: 'Stock inicial',
          userId,
          userName,
        }).save();

        results.push({
          name: item.name,
          status: 'Creado',
          newStock: item.quantity,
        });
      }
    }

    return results;
  },
};

