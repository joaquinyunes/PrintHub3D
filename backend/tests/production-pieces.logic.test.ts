import {
  NEXT_PIECE_STATUS,
  normalizeColor,
  colorSwatch,
  itemState,
  progressOf,
  groupQueueByColor,
  groupQueueByCustomer,
  weekBucket,
  dueInfo,
  piecesForItem,
} from '../src/modules/production/pieces.logic';

const p = (status: string, done: number, total: number) => ({ status, quantityDone: done, quantityTotal: total });

describe('colores', () => {
  it('normalizeColor ignora mayúsculas, tildes y espacios', () => {
    expect(normalizeColor('  Marrón  Claro ')).toBe('marron claro');
    expect(normalizeColor(null)).toBe('');
  });
  it('colorSwatch reconoce colores libres y celeste no cae en azul', () => {
    expect(colorSwatch('Negro mate')).toBe('#111111');
    expect(colorSwatch('celeste pastel')).toBe('#6EC1E4');
    expect(colorSwatch('galaxia')).toBeNull();
  });
});

describe('estado de las piezas', () => {
  it('el ciclo es pendiente → imprimiendo → hecha → pendiente', () => {
    expect(NEXT_PIECE_STATUS.pending).toBe('printing');
    expect(NEXT_PIECE_STATUS.printing).toBe('done');
    expect(NEXT_PIECE_STATUS.done).toBe('pending');
  });
  it('itemState resume las piezas de un ítem', () => {
    expect(itemState([])).toBe('none');
    expect(itemState([p('pending', 0, 2)])).toBe('todo');
    expect(itemState([p('pending', 0, 2), p('printing', 0, 1)])).toBe('printing');
    expect(itemState([p('done', 2, 2), p('done', 1, 1)])).toBe('done');
  });
  it('progressOf suma lo hecho y lo total', () => {
    expect(progressOf([p('done', 2, 2), p('pending', 0, 3)])).toEqual({ done: 2, total: 5 });
  });
});

describe('cola ¿Qué imprimo?', () => {
  const e = (color: string | null, dueDate: string, customerKey = 'a', customerName = 'Ana') => ({ color, dueDate, customerKey, customerName });

  it('agrupa por color normalizado y ordena por la fecha más urgente', () => {
    const groups = groupQueueByColor([e('Rojo', '2026-11-10'), e('negro', '2026-11-02'), e(' ROJO ', '2026-11-01'), e(null, '2026-12-01')]);
    expect(groups.map((g) => g.label)).toEqual(['Rojo', 'negro', 'Sin color']);
    expect(groups[0].entries.map((x) => x.dueDate)).toEqual(['2026-11-01', '2026-11-10']);
    expect(groups[0].swatch).toBe('#D93A2B');
  });
  it('una pieza sin fecha va al final de su grupo y de la cola', () => {
    const groups = groupQueueByColor([e('Rojo', ''), e('Rojo', '2026-11-05'), e('Azul', '')]);
    expect(groups.map((g) => g.label)).toEqual(['Rojo', 'Azul']);
    expect(groups[0].entries.map((x) => x.dueDate)).toEqual(['2026-11-05', '']);
  });
  it('agrupa por cliente con el más urgente primero', () => {
    const groups = groupQueueByCustomer([e('Rojo', '2026-11-09', 'b', 'Beto'), e('Rojo', '2026-11-03', 'a', 'Ana'), e('Azul', '2026-11-01', 'b', 'Beto')]);
    expect(groups.map((g) => g.label)).toEqual(['Beto', 'Ana']);
    expect(groups[0].earliest).toBe('2026-11-01');
  });
});

describe('vencimientos (hoy = martes 2026-10-27)', () => {
  const today = '2026-10-27';
  it('weekBucket separa atrasado, esta semana, próxima y más adelante', () => {
    expect(weekBucket('2026-10-26', today)).toBe('late');
    expect(weekBucket('2026-11-01', today)).toBe('this');
    expect(weekBucket('2026-11-02', today)).toBe('next');
    expect(weekBucket('2026-11-08', today)).toBe('next');
    expect(weekBucket('2026-11-09', today)).toBe('later');
  });
  it('dueInfo da una etiqueta humana y un tono', () => {
    expect(dueInfo('2026-10-27', today)).toEqual({ label: 'Hoy', tone: 'soon' });
    expect(dueInfo('2026-10-28', today)).toEqual({ label: 'Mañana', tone: 'soon' });
    expect(dueInfo('2026-10-26', today)).toEqual({ label: 'Atrasado 1 día', tone: 'late' });
    expect(dueInfo('2026-10-24', today)).toEqual({ label: 'Atrasado 3 días', tone: 'late' });
    expect(dueInfo('2026-10-30', today)).toEqual({ label: 'Viernes', tone: 'ok' });
    expect(dueInfo('2026-11-03', today)).toEqual({ label: '03/11', tone: 'ok' });
    expect(dueInfo('', today)).toEqual({ label: 'Sin fecha', tone: 'ok' });
  });
});

describe('piezas de un ítem', () => {
  it('multiplica cada parte por la cantidad del ítem y limpia colores vacíos', () => {
    const parts = [{ label: ' Cabeza ', color: 'Rojo', quantity: 1 }, { label: 'Cuerpo', color: '', quantity: 2 }, { label: '  ', color: 'x', quantity: 5 }];
    expect(piecesForItem(parts, 3)).toEqual([
      { label: 'Cabeza', color: 'Rojo', quantity: 3 },
      { label: 'Cuerpo', color: null, quantity: 6 },
    ]);
  });
});
