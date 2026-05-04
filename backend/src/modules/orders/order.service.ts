import OrderRepository from '../../repositories/order.repository';
import ProductRepository from '../../repositories/product.repository';
import Sale from '../sales/sale.model';
import Client from '../clients/client.model';
import { InventoryService } from '../products/inventory.service';
import InventoryMovement from '../inventory/inventory-movement.model';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

interface OrderItemInput {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  isCustom?: boolean;
  printTimeMinutes?: number;
}

export interface CreateOrderInput {
  tenantId: string;
  clientName: string;
  origin?: string;
  paymentMethod?: string;
  deposit?: number;
  notes?: string;
  items: OrderItemInput[];
  dueDate?: string | Date | null;
  files?: Array<{ name: string; url: string }>;
  customerContact?: string;
}

export interface RegisterOrderSaleInput {
  tenantId: string;
  orderId: string;
  finalCost?: number | string | null;
}

const buildTrackingCode = () => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `PH-${stamp}${random}`;
};

export const OrderService = {
  async createOrder(input: CreateOrderInput) {
    const {
      tenantId,
      clientName,
      origin,
      paymentMethod,
      deposit,
      notes,
      items,
      dueDate,
      files,
      customerContact,
    } = input;

    if (!tenantId) {
      throw new Error('TenantId requerido para crear pedido');
    }

    if (!clientName || !Array.isArray(items) || items.length === 0) {
      throw new Error('Datos de pedido incompletos');
    }

    let calculatedTotal = 0;
    let calculatedCost = 0;

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let productCost = 0;
        if (item.productId && !item.isCustom) {
          try {
            const product = await productRepository.findById(item.productId, tenantId);
            if (product) productCost = product.cost ?? 0;
          } catch (err) {
            console.error('Error buscando producto en OrderService:', err);
          }
        }

        const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
        const subcost = Number(productCost || 0) * Number(item.quantity || 0);

        calculatedTotal += subtotal;
        calculatedCost += subcost;

        return {
          ...item,
          printedQuantity: 0,
          printTimeMinutes: item.printTimeMinutes || 30,
        };
      }),
    );

    const profit = calculatedTotal - calculatedCost;
    const trackingCode = buildTrackingCode();

    // Crear orden
    const newOrder = await orderRepository.create({
      clientName,
      origin: origin || 'Local',
      paymentMethod: paymentMethod || 'Efectivo',
      deposit: Number(deposit) || 0,
      notes,
      trackingCode,
      customerContact: customerContact || '',
      items: enrichedItems,
      total: calculatedTotal,
      dueDate: dueDate ? new Date(dueDate) : null,
      files: files || [],
      profit,
      status: 'pending',
      tenantId,
    } as any);

    // Registrar movimientos de inventario si hay productos asociados
    for (const item of enrichedItems) {
      if (item.productId && !item.isCustom) {
        try {
          const product = await productRepository.findById(item.productId, tenantId);
          if (product) {
            const previousStock = product.stock;
            product.stock -= item.quantity;
            await product.save();

            await new InventoryMovement({
              tenantId,
              productId: product._id,
              productName: product.name,
              type: 'order_consumption',
              quantity: item.quantity,
              previousStock,
              newStock: product.stock,
              unit: 'unidades',
              reason: `Orden ${trackingCode}`,
              orderId: (newOrder as any)._id?.toString(),
            }).save();
          }
        } catch (invError) {
          console.error('Error actualizando inventario:', invError);
        }
      }
    }

    // Actualizar CRM de forma no bloqueante
    try {
      if (Client) {
        let client = await Client.findOne({ name: clientName, tenantId });
        if (client) {
          client.totalSpent += calculatedTotal;
          client.orderCount += 1;
          client.lastOrderDate = new Date();
          await client.save();
        } else {
          await Client.create({
            name: clientName,
            source: origin || 'Local',
            totalSpent: calculatedTotal,
            orderCount: 1,
            lastOrderDate: new Date(),
            tenantId,
          });
        }
      }
    } catch (crmError) {
      console.error(
        'CRM Warning: No se pudo actualizar el cliente, pero el pedido se guardó.',
        crmError,
      );
    }

    return newOrder;
  },

  async registerOrderSale(input: RegisterOrderSaleInput) {
    const { tenantId, orderId, finalCost } = input;

    if (!tenantId) {
      throw new Error('TenantId requerido para registrar venta de pedido');
    }

    const order = await orderRepository.findById(orderId, tenantId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    if ((order as any).isSaleRegistered) {
      throw new Error('Venta ya registrada');
    }

    let totalCost = 0;
    if (
      finalCost !== undefined &&
      finalCost !== null &&
      finalCost !== '' &&
      !Number.isNaN(Number(finalCost))
    ) {
      totalCost = Number(finalCost);
    }

    const totalStats = {
      price: (order as any).total,
      cost: totalCost,
      profit: (order as any).total - totalCost,
    };

    const newSale = new Sale({
      productName: `Pedido: ${(order as any).clientName}`,
      productId: (order as any)._id,
      quantity: 1,
      price: totalStats.price,
      cost: totalStats.cost,
      profit: totalStats.profit,
      category: 'Servicio',
      tenantId,
      createdAt: new Date(),
    });

    await newSale.save();

    await orderRepository.update(orderId, { 
      status: 'delivered', 
      isSaleRegistered: true 
    } as any, tenantId);

    const updatedOrder = await orderRepository.findById(orderId, tenantId);

    return { sale: newSale, order: updatedOrder };
  },
};
