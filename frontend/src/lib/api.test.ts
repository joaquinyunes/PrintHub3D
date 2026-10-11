import { describe, expect, it } from 'vitest';
import { apiUrl, resolveMediaUrl } from './api';

describe('apiUrl', () => {
  it('une base y path sin duplicar barras', () => {
    expect(apiUrl('/api/orders')).toMatch(/^https?:\/\/[^/]+\/api\/orders$/);
    expect(apiUrl('api/orders')).toMatch(/\/api\/orders$/);
  });
});

describe('resolveMediaUrl', () => {
  it('deja intactas las URLs absolutas', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('/uploads lo sirve el backend: se prefija con la API', () => {
    expect(resolveMediaUrl('/uploads/123-abc.png')).toBe(apiUrl('/uploads/123-abc.png'));
  });

  it('el resto de rutas absolutas son assets del propio frontend', () => {
    expect(resolveMediaUrl('/demo/producto.svg')).toBe('/demo/producto.svg');
    expect(resolveMediaUrl('logo.png')).toBe('/logo.png');
  });

  it('string vacío devuelve vacío', () => {
    expect(resolveMediaUrl('')).toBe('');
  });
});
