import type { Types } from "mongoose";
import Piece from './piece.model';
import Product from '../products/product.model';
import logger from '../../config/logger';
import { PartLine, normalizeColor, piecesForItem } from './pieces.logic';

type OrderLike = {
  _id: Types.ObjectId;
  trackingCode: string;
  clientName: string;
  dueDate?: Date | null;
  items: Array<{ productId?: unknown; productName: string; quantity: number }>;
};

const dueOf = (order: OrderLike): string => (order.dueDate ? new Date(order.dueDate).toISOString().slice(0, 10) : '');

/** Partes de cada producto del pedido (por id de producto), solo del taller dado. */
async function partsByProduct(order: OrderLike, tenantId: string): Promise<Map<string, PartLine[]>> {
  const ids = [...new Set(order.items.map((i) => (i.productId ? String(i.productId) : '')).filter(Boolean))];
  if (!ids.length) return new Map();
  const products = await Product.find({ _id: { $in: ids }, tenantId }).select('parts').lean();
  return new Map(products.filter((p) => p.parts?.length).map((p) => [String(p._id), p.parts as PartLine[]]));
}

/**
 * Arma las piezas del pedido. Prioridad por ítem: partes enviadas a mano > partes del producto > una sola pieza con el nombre.
 */
export async function createPiecesForOrder(order: OrderLike, tenantId: string, overrides: Map<number, PartLine[]> = new Map()) {
  const catalog = await partsByProduct(order, tenantId);
  const dueDate = dueOf(order);
  const docs = order.items.flatMap((item, idx) => {
    const parts = overrides.get(idx)?.length ? overrides.get(idx)! : item.productId ? catalog.get(String(item.productId)) : undefined;
    const pieces = parts?.length
      ? piecesForItem(parts, item.quantity)
      : [{ label: item.productName, color: null, quantity: Math.max(1, Math.floor(item.quantity)) }];
    return pieces.map((p) => ({
      tenantId, orderId: order._id, trackingCode: order.trackingCode, clientName: order.clientName,
      customerKey: normalizeColor(order.clientName), itemName: item.productName, label: p.label, color: p.color,
      quantityTotal: p.quantity, dueDate,
    }));
  });
  return Piece.insertMany(docs);
}

/**
 * Al crear un pedido: si algún producto tiene partes, las piezas salen solas.
 * Sin partes en ningún producto no hace nada (el taller las arma a mano desde la cola).
 * Nunca rompe la creación del pedido.
 */
export async function autoCreatePieces(order: OrderLike, tenantId: string): Promise<number> {
  try {
    if ((await partsByProduct(order, tenantId)).size === 0) return 0;
    if (await Piece.exists({ tenantId, orderId: order._id })) return 0;
    return (await createPiecesForOrder(order, tenantId)).length;
  } catch (e) {
    logger.error('No se pudieron generar las piezas automáticas del pedido', e);
    return 0;
  }
}
