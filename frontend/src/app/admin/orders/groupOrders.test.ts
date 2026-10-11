import { describe, expect, it } from 'vitest';
import {
  dueDateGroupKey,
  filterAndSortOrders,
  groupOrdersByDueDate,
  parseDueDate,
  sortGroupKeys,
} from './groupOrders';
import type { Order } from './types';

// Miércoles 15/10/2025, mediodía (hora local)
const NOW = new Date(2025, 9, 15, 12, 0, 0);

const make = (over: Partial<Order>): Order => ({
  _id: Math.random().toString(36).slice(2),
  clientName: 'Cliente',
  total: 1000,
  status: 'pending',
  createdAt: '2025-10-01T10:00:00.000Z',
  items: [],
  ...over,
});

describe('parseDueDate', () => {
  it('toma solo el día: no se corre al día anterior por el huso horario', () => {
    const d = parseDueDate('2025-10-10T00:00:00.000Z');
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(9);
    expect(d?.getDate()).toBe(10);
  });

  it('devuelve null si no hay fecha válida', () => {
    expect(parseDueDate(undefined)).toBeNull();
    expect(parseDueDate('')).toBeNull();
    expect(parseDueDate('no-es-fecha')).toBeNull();
  });
});

describe('dueDateGroupKey', () => {
  it('marca vencidos, hoy y mañana respecto de la fecha actual', () => {
    expect(dueDateGroupKey(make({ dueDate: '2025-10-14T00:00:00.000Z' }), 'production', NOW)).toBe('⚠️ VENCIDOS');
    expect(dueDateGroupKey(make({ dueDate: '2025-10-15T00:00:00.000Z' }), 'production', NOW)).toBe('🔥 PARA HOY');
    expect(dueDateGroupKey(make({ dueDate: '2025-10-16T00:00:00.000Z' }), 'production', NOW)).toBe('🚀 PARA MAÑANA');
  });

  it('una fecha más lejana queda como día de la semana', () => {
    const key = dueDateGroupKey(make({ dueDate: '2025-10-20T00:00:00.000Z' }), 'production', NOW);
    expect(key.startsWith('📅')).toBe(true);
    expect(key).toContain('20');
  });

  it('sin fecha de entrega va a "sin fecha asignada"', () => {
    expect(dueDateGroupKey(make({}), 'production', NOW)).toBe('📂 SIN FECHA ASIGNADA');
  });

  it('en el historial se agrupa por fecha, nunca como vencido', () => {
    const key = dueDateGroupKey(make({ dueDate: '2025-10-01T00:00:00.000Z' }), 'history', NOW);
    expect(key.startsWith('📅')).toBe(true);
    expect(key).not.toContain('VENCIDOS');
  });
});

describe('filterAndSortOrders', () => {
  const orders = [
    make({ _id: 'a', clientName: 'Ana', status: 'pending', dueDate: '2025-10-20' }),
    make({ _id: 'b', clientName: 'Beto', status: 'in_progress', dueDate: '2025-10-25' }),
    make({ _id: 'c', clientName: 'Carla', status: 'pending', dueDate: '2025-10-18' }),
    make({ _id: 'd', clientName: 'Dani', status: 'completed' }),
    make({ _id: 'e', clientName: 'Eli', status: 'delivered', createdAt: '2025-09-01T00:00:00.000Z' }),
    make({ _id: 'f', clientName: 'Fede', status: 'cancelled', createdAt: '2025-10-10T00:00:00.000Z' }),
  ];

  it('cada pestaña muestra solo sus estados', () => {
    expect(filterAndSortOrders(orders, 'production', '').map((o) => o._id)).toEqual(['b', 'c', 'a']);
    expect(filterAndSortOrders(orders, 'ready', '').map((o) => o._id)).toEqual(['d']);
    expect(filterAndSortOrders(orders, 'history', '').map((o) => o._id)).toEqual(['f', 'e']);
  });

  it('en producción, lo que se está imprimiendo va primero y el resto por fecha de entrega', () => {
    const ids = filterAndSortOrders(orders, 'production', '').map((o) => o._id);
    expect(ids[0]).toBe('b');
    expect(ids.slice(1)).toEqual(['c', 'a']);
  });

  it('busca por nombre de cliente sin distinguir mayúsculas', () => {
    expect(filterAndSortOrders(orders, 'production', 'CARL').map((o) => o._id)).toEqual(['c']);
  });
});

describe('groupOrdersByDueDate + sortGroupKeys', () => {
  it('ordena los grupos: vencidos, hoy, mañana, fechas y sin fecha', () => {
    const orders = [
      make({ _id: 'sin' }),
      make({ _id: 'futuro', dueDate: '2025-10-30' }),
      make({ _id: 'manana', dueDate: '2025-10-16' }),
      make({ _id: 'hoy', dueDate: '2025-10-15' }),
      make({ _id: 'vencido', dueDate: '2025-10-01' }),
    ];
    const groups = groupOrdersByDueDate(orders, 'production', NOW);
    const keys = sortGroupKeys(Object.keys(groups));

    expect(keys[0]).toBe('⚠️ VENCIDOS');
    expect(keys[1]).toBe('🔥 PARA HOY');
    expect(keys[2]).toBe('🚀 PARA MAÑANA');
    expect(keys[keys.length - 1]).toBe('📂 SIN FECHA ASIGNADA');
    expect(groups['⚠️ VENCIDOS'].map((o) => o._id)).toEqual(['vencido']);
  });
});
