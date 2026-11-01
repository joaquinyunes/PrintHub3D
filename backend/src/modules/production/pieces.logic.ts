// Lógica pura de la cola de producción por piezas, portada de global3d-corrientes (features/production/pieces.ts y due.ts).
// Sin base de datos ni Express: se prueba sola (tests/production-pieces.logic.test.ts).

export type PieceStatus = 'pending' | 'printing' | 'done';
export type ItemState = 'none' | 'todo' | 'printing' | 'done';
export type DueTone = 'late' | 'soon' | 'ok';
export type WeekBucket = 'late' | 'this' | 'next' | 'later';

export interface PieceLike {
  status: string;
  quantityDone: number;
  quantityTotal: number;
}

export const NEXT_PIECE_STATUS: Record<PieceStatus, PieceStatus> = {
  pending: 'printing',
  printing: 'done',
  done: 'pending',
};

export const normalizeColor = (color: string | null | undefined): string =>
  (color ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');

const SWATCHES: [RegExp, string][] = [
  [/negr|black/, '#111111'],
  [/blanc|white/, '#FFFFFF'],
  [/rojo|red/, '#D93A2B'],
  [/celeste|sky/, '#6EC1E4'],
  [/azul|blue/, '#1E4FA8'],
  [/amarill|yellow/, '#F2C230'],
  [/dorad|oro|gold/, '#D4AF37'],
  [/platead|plata|silver/, '#C0C0C0'],
  [/gris|gray|grey/, '#8A8D91'],
  [/verde|green/, '#2E9E5B'],
  [/rosa|pink/, '#F28DB2'],
  [/naranja|orange/, '#F37021'],
  [/violeta|lila|purple|morado/, '#7E57C2'],
  [/marron|cafe|brown|dulce de leche/, '#8B5A2B'],
  [/beige|piel|crema/, '#E8D3B0'],
];

// El color es texto libre: un nombre desconocido simplemente no tiene muestra.
export const colorSwatch = (color: string | null | undefined): string | null => {
  const key = normalizeColor(color);
  return key ? SWATCHES.find(([re]) => re.test(key))?.[1] ?? null : null;
};

export const itemState = (pieces: readonly PieceLike[]): ItemState => {
  if (pieces.length === 0) return 'none';
  if (pieces.every((p) => p.status === 'done')) return 'done';
  if (pieces.some((p) => p.status !== 'pending')) return 'printing';
  return 'todo';
};

export const progressOf = (pieces: readonly PieceLike[]): { done: number; total: number } =>
  pieces.reduce((acc, p) => ({ done: acc.done + p.quantityDone, total: acc.total + p.quantityTotal }), { done: 0, total: 0 });

// ---- cola "¿Qué imprimo?" ------------------------------------------------------
export interface QueueEntry {
  color: string | null;
  dueDate: string; // YYYY-MM-DD; '' = sin fecha (va al final)
}
export interface QueueGroup<T extends QueueEntry> {
  key: string;
  label: string;
  swatch: string | null;
  earliest: string;
  entries: T[];
}

const NO_DATE = '9999-12-31';
const dueKey = (d: string) => d || NO_DATE;
const byDue = (a: QueueEntry, b: QueueEntry) => dueKey(a.dueDate).localeCompare(dueKey(b.dueDate));

function group<T extends QueueEntry>(
  entries: readonly T[],
  keyOf: (e: T) => string,
  build: (e: T) => Pick<QueueGroup<T>, 'label' | 'swatch'>,
  within: (a: T, b: T) => number,
): QueueGroup<T>[] {
  const groups = new Map<string, QueueGroup<T>>();
  for (const e of entries) {
    const k = keyOf(e);
    let g = groups.get(k);
    if (!g) {
      g = { key: k, ...build(e), earliest: dueKey(e.dueDate), entries: [] };
      groups.set(k, g);
    }
    g.entries.push(e);
    if (dueKey(e.dueDate) < g.earliest) g.earliest = dueKey(e.dueDate);
  }
  const list = [...groups.values()];
  for (const g of list) g.entries.sort(within);
  return list.sort((a, b) => a.earliest.localeCompare(b.earliest) || a.label.localeCompare(b.label));
}

// Piezas pendientes agrupadas por color normalizado; los grupos van por su vencimiento más urgente.
export const groupQueueByColor = <T extends QueueEntry>(entries: readonly T[]): QueueGroup<T>[] =>
  group<T>(entries, (e) => normalizeColor(e.color), (e) => ({ label: normalizeColor(e.color) ? e.color!.trim() : 'Sin color', swatch: colorSwatch(e.color) }), byDue);

// Lo mismo por cliente, con el más urgente primero.
export const groupQueueByCustomer = <T extends QueueEntry & { customerKey: string; customerName: string }>(entries: readonly T[]): QueueGroup<T>[] =>
  group<T>(entries, (e) => e.customerKey, (e) => ({ label: e.customerName, swatch: null }),
    (a, b) => byDue(a, b) || normalizeColor(a.color).localeCompare(normalizeColor(b.color)));

// ---- vencimientos --------------------------------------------------------------
export const daysBetween = (from: string, to: string): number => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
};

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Las semanas van de lunes a domingo; lo atrasado tiene su propio balde para que no se esconda en "esta semana".
export const weekBucket = (due: string, today: string): WeekBucket => {
  if (!due) return 'later';
  const diff = daysBetween(today, due);
  if (diff < 0) return 'late';
  const [y, m, d] = today.split('-').map(Number);
  const toSunday = (7 - new Date(Date.UTC(y, m - 1, d)).getUTCDay()) % 7;
  if (diff <= toSunday) return 'this';
  return diff <= toSunday + 7 ? 'next' : 'later';
};

export const dueInfo = (due: string, today: string): { label: string; tone: DueTone } => {
  if (!due) return { label: 'Sin fecha', tone: 'ok' };
  const diff = daysBetween(today, due);
  if (diff < 0) return { label: `Atrasado ${-diff} ${diff === -1 ? 'día' : 'días'}`, tone: 'late' };
  if (diff === 0) return { label: 'Hoy', tone: 'soon' };
  if (diff === 1) return { label: 'Mañana', tone: 'soon' };
  const [y, m, d] = due.split('-').map(Number);
  if (diff < 7) return { label: WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], tone: 'ok' };
  return { label: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`, tone: 'ok' };
};

// ---- piezas de un ítem de pedido -----------------------------------------------
export interface PartLine {
  label: string;
  color: string;
  quantity: number;
}

const partQty = (raw: number): number => {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// Cada parte × la cantidad del ítem; las filas sin nombre se ignoran.
export const piecesForItem = (parts: readonly PartLine[], itemQuantity: number): { label: string; color: string | null; quantity: number }[] => {
  const qty = partQty(itemQuantity);
  return parts
    .filter((p) => p.label.trim() !== '')
    .map((p) => ({ label: p.label.trim(), color: p.color.trim() || null, quantity: partQty(p.quantity) * qty }));
};
