import Order, { IOrder } from './order.model';
import Product from '../products/product.model';
import Sale from '../sales/sale.model';
import Client from '../clients/client.model';

interface OrderItemInput {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  isCustom?: boolean;
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
  async createOrder(input: CreateOrderInput): Promise<IOrder> {
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
            const product = await Product.findOne({
              _id: item.productId,
              tenantId,
            });
            if (product) productCost = product.cost ?? 0;
          } catch (err) {
            console.error('Error buscando producto en OrderService:', err);
          }
        }

        const subtotal = Number(item.price) * Number(item.quantity);
        const subcost = productCost * Number(item.quantity);

        calculatedTotal += subtotal;
        calculatedCost += subcost;

        return item;
      }),
    );

    const profit = calculatedTotal - calculatedCost;
    const trackingCode = buildTrackingCode();

    const newOrder = new Order({
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
    });

    const savedOrder = await newOrder.save();

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

    return savedOrder;
  },

  async registerOrderSale(input: RegisterOrderSaleInput) {
    const { tenantId, orderId, finalCost } = input;

    if (!tenantId) {
      throw new Error('TenantId requerido para registrar venta de pedido');
    }

    const order = await Order.findOne({ _id: orderId, tenantId });
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
      price: order.total,
      cost: totalCost,
      profit: order.total - totalCost,
    };

    const newSale = new Sale({
      productName: `Pedido: ${order.clientName}`,
      productId: order._id,
      quantity: 1,
      price: totalStats.price,
      cost: totalStats.cost,
      profit: totalStats.profit,
      category: 'Servicio',
      tenantId,
      createdAt: new Date(),
    });

    await newSale.save();

    order.status = 'delivered';
    (order as any).isSaleRegistered = true;
    await order.save();

    return { sale: newSale, order };
  },
};

