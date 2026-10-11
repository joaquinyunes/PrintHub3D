import { TABS } from './constants';
import type { Order, TabId } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NO_DATE_KEY = '📂 SIN FECHA ASIGNADA';
const NO_DUE_DATE_SORT = 9999999999999;

/** Pedidos de una pestaña que coinciden con la búsqueda, ya ordenados. */
export function filterAndSortOrders(orders: Order[], tab: TabId, searchTerm: string): Order[] {
  const statuses = TABS.find((t) => t.id === tab)?.statuses ?? [];
  const needle = searchTerm.toLowerCase();

  return orders
    .filter(
      (o) => statuses.includes(o.status) && (o.clientName || '').toLowerCase().includes(needle),
    )
    .sort((a, b) => {
      if (tab === 'production') {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      }
      if (tab === 'history') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : NO_DUE_DATE_SORT;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : NO_DUE_DATE_SORT;
      return dateA - dateB;
    });
}

/**
 * La fecha de entrega llega como `2026-10-10T00:00:00.000Z` (solo día, sin hora real).
 * `new Date(...)` la corre al día anterior en husos negativos (Argentina) y mostraba
 * "9/10" para algo que vence el 10. Se toma solo la parte AAAA-MM-DD como fecha local.
 */
export function parseDueDate(dueDate?: string | null): Date | null {
  const dateStr = typeof dueDate === 'string' ? dueDate.split('T')[0] : '';
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Etiqueta de grupo según la fecha de entrega relativa a `now`. */
export function dueDateGroupKey(order: Order, tab: TabId, now: Date = new Date()): string {
  const orderDate = parseDueDate(order.dueDate);
  if (!orderDate) return NO_DATE_KEY;

  if (tab === 'history') return `📅 ${orderDate.toLocaleDateString('es-AR')}`;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(orderDate);
  checkDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((checkDate.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffDays < 0) return '⚠️ VENCIDOS';
  if (diffDays === 0) return '🔥 PARA HOY';
  if (diffDays === 1) return '🚀 PARA MAÑANA';
  return `📅 ${orderDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
}

export function groupOrdersByDueDate(
  orders: Order[],
  tab: TabId,
  now: Date = new Date(),
): Record<string, Order[]> {
  const groups: Record<string, Order[]> = {};
  for (const order of orders) {
    const key = dueDateGroupKey(order, tab, now);
    (groups[key] ||= []).push(order);
  }
  return groups;
}

const GROUP_PRIORITY: Record<string, number> = { '⚠️': 1, '🔥': 2, '🚀': 3, '📅': 4, '📂': 5 };

/** Vencidos primero, después hoy, mañana, fechas y por último "sin fecha". */
export function sortGroupKeys(keys: string[]): string[] {
  const priority = (k: string) => GROUP_PRIORITY[k.split(' ')[0]] || 4;
  return [...keys].sort((a, b) => priority(a) - priority(b));
}
