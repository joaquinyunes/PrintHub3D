/**
 * Calculadora de costo por pieza, portada de la planilla "Calculadora_3D_GLOBAL3D"
 * (global3d-corrientes/src/features/calculator/calculator.ts). A diferencia de
 * `quote.pricing.ts` (estimador público desde medidas), esta parte de los gramos y las
 * horas que da el slicer y de los costos reales del taller. Diferencias: docs/COTIZACION-DIFERENCIAS.md.
 *
 *   horas      = h + min/60
 *   material   = (g/1000) · $/kg
 *   luz        = horas · (W/1000) · $/kWh
 *   desgaste   = horas · (repuestos / vida útil)
 *   error      = (material + luz + desgaste) · %error
 *   costo      = material + luz + desgaste + error
 *   insumos    = insumos extra · 1,3
 *   TOTAL      = costo · multiplicador + insumos
 *   MercadoLibre = costo · (multiplicador + recargo ML) + insumos
 */

export const EXTRAS_MARKUP = 1.3;

export interface CostSettings {
  filamentPrice: number; // $/kg
  kwhPrice: number; // $/kWh
  watts: number;
  lifeHours: number;
  spareParts: number; // $ por la vida útil de la máquina
  errorPct: number; // 5 = 5 %
  mlSurcharge: number; // se suma al multiplicador para el precio de MercadoLibre
}

export interface PieceInput {
  hours: number;
  minutes: number;
  grams: number;
  extras: number; // $ de insumos no impresos (argollas, imanes…)
}

export interface CostQuote {
  material: number;
  power: number;
  wear: number;
  error: number;
  cost: number;
  extras: number;
  total: number;
  mercadoLibre: number;
}

// Entradas inválidas (NaN, negativas, Infinity) cuentan como 0: nunca producen un precio negativo ni NaN.
const clean = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0);
const cents = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function costQuote(s: CostSettings, p: PieceInput, multiplier: number): CostQuote {
  const hours = clean(p.hours) + clean(p.minutes) / 60;
  const material = (clean(p.grams) / 1000) * clean(s.filamentPrice);
  const power = hours * (clean(s.watts) / 1000) * clean(s.kwhPrice);
  const wear = clean(s.lifeHours) > 0 ? hours * (clean(s.spareParts) / clean(s.lifeHours)) : 0;
  const error = (material + power + wear) * (clean(s.errorPct) / 100);
  const cost = material + power + wear + error;
  const extras = clean(p.extras) * EXTRAS_MARKUP;
  const m = clean(multiplier);
  return {
    material: cents(material),
    power: cents(power),
    wear: cents(wear),
    error: cents(error),
    cost: cents(cost),
    extras: cents(extras),
    total: cents(cost * m + extras),
    mercadoLibre: cents(cost * (m + clean(s.mlSurcharge)) + extras),
  };
}
