import { describe, expect, it } from 'vitest';
import { mergeOrderProductTypes, normalizeTypeKey } from './constants';

describe('normalizeTypeKey', () => {
  it('ignora mayúsculas, tildes, eñes, espacios y símbolos', () => {
    expect(normalizeTypeKey(' Vaso-Huracán ')).toBe('vasohuracan');
    expect(normalizeTypeKey('Año Nuevo!')).toBe('anonuevo');
  });
});

describe('mergeOrderProductTypes', () => {
  it('siempre empieza con "Sin tipo"', () => {
    expect(mergeOrderProductTypes([])[0]).toEqual({ value: '', label: 'Sin tipo' });
  });

  it('agrega los tipos de "Videos por código" antes que los de por defecto', () => {
    const out = mergeOrderProductTypes([{ code: 'mate-groot', name: 'Mate Groot' }]);
    expect(out[1]).toEqual({ value: 'mate-groot', label: 'Mate Groot' });
    expect(out.some((t) => t.value === 'vasoriver')).toBe(true);
  });

  it('no duplica un tipo que ya existe aunque cambie el formato', () => {
    const out = mergeOrderProductTypes([{ code: 'Vaso-River', name: 'Mi vaso' }]);
    const rivers = out.filter((t) => t.value.toLowerCase().replace(/[^a-z]/g, '') === 'vasoriver');
    expect(rivers).toHaveLength(1);
    expect(rivers[0].label).toBe('Mi vaso'); // gana el definido por el admin
  });

  it('ignora filas sin código y usa el código como etiqueta si falta el nombre', () => {
    const out = mergeOrderProductTypes([{ code: '  ' }, { code: 'taza' }]);
    expect(out.find((t) => t.value === 'taza')?.label).toBe('taza');
    expect(out.filter((t) => t.value.trim() === '').length).toBe(1);
  });
});
