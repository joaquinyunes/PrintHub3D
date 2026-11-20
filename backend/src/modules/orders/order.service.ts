import { OrderRepository } from '../../repositories/order.repository';
import { autoCreatePieces } from '../production/pieces.service';
import Product from '../products/product.model';
import Order from './order.model';
import { ProductRepository } from '../../repositories/product.repository';
import logger from '../../config/logger';
import Sale from '../sales/sale.model';
import Client from '../clients/client.model';
import { InventoryService } from '../products/inventory.service';
import InventoryMovement from '../inventory/inventory-movement.model';
import { AppError } from '../../utils/AppError';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

interface OrderItemInput {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  isCustom?: boolean;
  productType?: string;
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
  files?: Array<{ name: string; url: string; kind?: 'image' | 'model' | 'link' }>;
  customerContact?: string;
  chatLink?: string;
  referenceUrl?: string;
  /**
   * `false` para pedidos que vienen de un visitante anónimo (checkout web): el
   * precio SIEMPRE sale del producto guardado en la base y no se aceptan ítems
   * "personalizados" ni sin productId. Por defecto `true` (panel admin/staff).
   */
  trustClientPrices?: boolean;
}

export interface RegisterOrderSaleInput {
  tenantId: string;
  orderId: string;
  finalCost?: number | string | null;
}

const slugifyPart = (raw: string) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
};

const formatDateDDMMYYYY = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
};

const buildCustomTrackingBase = (
  clientName: string,
  items: any[],
  dueDate?: string | Date | null,
) => {
  const customItem = items.find((item: any) => item.isCustom);
  const productLabel =
    (customItem?.productType && String(customItem.productType).trim()) ||
    (customItem?.productName && String(customItem.productName).trim()) ||
    'custom';

  const clientSlug = slugifyPart(clientName) || 'cliente';
  const productSlug = slugifyPart(productLabel) || 'producto';
  const d = dueDate ? new Date(dueDate) : new Date();
  const dateStr = formatDateDDMMYYYY(Number.isNaN(d.getTime()) ? new Date() : d);

  return `${clientSlug}-${productSlug}-${dateStr}`.toLowerCase();
};

const buildRandomTrackingCode = () => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `PH-${stamp}${random}`;
};

const ensureUniqueTrackingCode = async (preferred: string): Promise<string> => {
  let candidate = preferred;
  for (let n = 0; n < 40; n += 1) {
    const existing = await orderRepository.findByTrackingCode(candidate);
    if (!existing) return candidate;
    candidate = `${preferred}-${n + 2}`;
  }
  return `${preferred}-${Date.now().toString(36)}`;
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
      dueDate,
      files,
      customerContact,
      chatLink,
      referenceUrl,
    } = input;
    const trustClientPrices = input.trustClientPrices !== false;

    if (!tenantId) {
      throw new Error('TenantId requerido para crear pedido');
    }

    if (!clientName || !Array.isArray(input.items) || input.items.length === 0) {
      throw new Error('Datos de pedido incompletos');
    }

    // Pedidos anónimos: el cliente solo elige producto y cantidad; el precio lo pone el servidor.
    const items: OrderItemInput[] = trustClientPrices
      ? input.items
      : input.items.map((item) => {
          if (!item.productId) {
            throw new AppError('Cada producto del pedido debe estar en el catálogo', 400);
          }
          return {
            ...item,
            isCustom: false,
            quantity: Math.min(1000, Math.max(1, Math.floor(Number(item.quantity) || 1))),
          };
        });

    let calculatedTotal = 0;
    let calculatedCost = 0;

    // Cantidad pedida POR PRODUCTO (si el mismo producto viene en dos renglones, se suman: no se esquiva el tope).
    const wanted = new Map<string, number>();
    for (const item of items) {
      if (item.productId && !item.isCustom) {
        const key = String(item.productId);
        wanted.set(key, (wanted.get(key) ?? 0) + Number(item.quantity || 0));
      }
    }

    // Validar disponibilidad (mensaje claro). La reserva real y atómica se hace más abajo.
    const names = new Map<string, string>();
    for (const [pid, qty] of wanted) {
      const product = await productRepository.findById(pid, tenantId).catch(() => null);
      if (!product) continue; // el armado de ítems informa "ya no está disponible"
      names.set(pid, product.name);
      // Visitante anónimo: solo lo que el catálogo público muestra; un producto oculto/borrador no se vende.
      if (!trustClientPrices && (product as any).isPublic !== true) {
        throw new AppError('Uno de los productos del pedido ya no está disponible', 409);
      }
      if (typeof product.stock === 'number' && product.stock < qty) {
        throw new Error(`Stock insuficiente de "${product.name}": disponible ${product.stock}, pedido ${qty}`);
      }
    }

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let productCost = 0;
        // El precio de catálogo nunca se confía del cliente: para ítems no personalizados
        // se recalcula siempre desde el producto guardado en la base de datos.
        let effectivePrice = Number(item.price || 0);
        if (item.productId && !item.isCustom) {
          const product = await productRepository.findById(item.productId, tenantId).catch((err) => {
            logger.error('Error buscando producto en OrderService:', err);
            return null;
          });
          if (!product) {
            throw new AppError('Uno de los productos del pedido ya no está disponible', 409);
          }
          productCost = product.cost ?? 0;
          effectivePrice = product.price ?? 0;
        }

        const subtotal = effectivePrice * Number(item.quantity || 0);
        const subcost = Number(productCost || 0) * Number(item.quantity || 0);

        calculatedTotal += subtotal;
        calculatedCost += subcost;

        return {
          ...item,
          price: effectivePrice,
          printedQuantity: 0,
          printTimeMinutes: item.printTimeMinutes || 30,
        };
      }),
    );

    const profit = calculatedTotal - calculatedCost;
    const hasCustomItem = items.some((item: any) => item.isCustom);
    const trackingBase =
      hasCustomItem && clientName
        ? buildCustomTrackingBase(clientName, items, dueDate)
        : buildRandomTrackingCode();
    const trackingCode = await ensureUniqueTrackingCode(trackingBase);

    // Reserva ATÓMICA de stock: `stock >= cantidad` y el descuento ocurren en una sola operación, así que dos pedidos
    // simultáneos nunca venden la misma unidad ni dejan el stock negativo. Si algo falla, se devuelve lo reservado.
    const reserved: Array<{ pid: string; qty: number; name: string; previousStock: number; newStock: number }> = [];
    const releaseStock = async () => {
      for (const r of reserved) await Product.updateOne({ _id: r.pid, tenantId }, { $inc: { stock: r.qty } }).catch((e) => logger.error('No se pudo devolver el stock reservado', e));
    };
    let newOrder: any;
    try {
      for (const [pid, qty] of wanted) {
        const updated: any = await Product.findOneAndUpdate({ _id: pid, tenantId, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { returnDocument: 'after' });
        if (!updated) {
          const current: any = await Product.findOne({ _id: pid, tenantId }).lean();
          throw new Error(`Stock insuficiente de "${names.get(pid) ?? current?.name ?? 'producto'}": disponible ${current?.stock ?? 0}, pedido ${qty}`);
        }
        reserved.push({ pid, qty, name: updated.name, previousStock: updated.stock + qty, newStock: updated.stock });
      }

    // Crear orden
    newOrder = await orderRepository.create({
      clientName,
      origin: origin || 'Local',
      paymentMethod: paymentMethod || 'Efectivo',
      deposit: Number(deposit) || 0,
      notes,
      trackingCode,
      customerContact: customerContact || '',
      chatLink: chatLink || '',
      referenceUrl: referenceUrl || '',
      items: enrichedItems,
      total: calculatedTotal,
      dueDate: dueDate ? new Date(dueDate) : null,
      files: files || [],
      profit,
      status: 'pending',
      tenantId,
    } as any);
    } catch (e) {
      await releaseStock();
      throw e;
    }

    // Registrar movimientos de inventario (el descuento ya se hizo en la reserva).
    for (const r of reserved) {
      try {
        await new InventoryMovement({
          tenantId,
          productId: r.pid,
          productName: r.name,
          type: 'order_consumption',
          quantity: r.qty,
          previousStock: r.previousStock,
          newStock: r.newStock,
          unit: 'unidades',
          reason: `Orden ${trackingCode}`,
          orderId: (newOrder as any)._id?.toString(),
        }).save();
      } catch (invError) {
        logger.error('Error registrando el movimiento de inventario:', invError);
      }
    }

    // Piezas automáticas si algún producto tiene partes definidas (no bloquea el pedido).
    await autoCreatePieces(newOrder as any, tenantId);

    // Actualizar CRM de forma no bloqueante
    try {
      if (Client) {
        const client = await Client.findOne({ name: clientName, tenantId });
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
      logger.error(
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

    // Reclamo atómico: dos clics/requests simultáneos no registran dos ventas.
    const claimed = await Order.findOneAndUpdate({ _id: orderId, tenantId, isSaleRegistered: { $ne: true } }, { $set: { isSaleRegistered: true } });
    if (!claimed) {
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
      orderId: (order as any)._id,
      quantity: 1,
      price: totalStats.price,
      cost: totalStats.cost,
      profit: totalStats.profit,
      category: 'Servicio',
      tenantId,
      createdAt: new Date(),
    });

    try {
      await newSale.save();
    } catch (e) {
      await Order.updateOne({ _id: orderId, tenantId }, { $set: { isSaleRegistered: false } });
      throw e;
    }

    await orderRepository.update(orderId, {
      status: 'delivered',
      isSaleRegistered: true
    } as any, tenantId);

    const updatedOrder = await orderRepository.findById(orderId, tenantId);

    return { sale: newSale, order: updatedOrder };
  },
};
