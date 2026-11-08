import { GoogleAuth } from 'google-auth-library';
import { supplyKey } from './supply.model';

/**
 * Sincronización de insumos desde una planilla (H11). Detrás de una interfaz para poder probarla sin Google:
 * `SheetsSource.readRows()` devuelve las filas como texto; `planSync` (pura) decide qué se crea/actualiza.
 * La planilla es de SOLO LECTURA: nunca se escribe en ella ni se borran insumos que no estén en ella.
 * Columnas esperadas: INSUMO | UNIDAD | STOCK | MÍNIMO (la fila de títulos se ignora).
 */
export interface SheetsSource {
  readRows(): Promise<string[][]>;
}

export interface ExistingSupply { _id: unknown; nameKey: string; name: string; unit: string; stock: number; minStock: number }
export interface SyncRow { name: string; unit: string; stock: number; minStock: number }
export interface SyncPlan {
  create: SyncRow[];
  update: { id: unknown; name: string; changes: Partial<Record<'unit' | 'stock' | 'minStock', { from: unknown; to: unknown }>>; row: SyncRow }[];
  unchanged: number;
  invalid: { row: number; reason: string }[];
}

/** "1.200,5" / "3,5" / "12" → número; vacío o basura → NaN. */
export const parseAmount = (raw: unknown): number => {
  let s = String(raw ?? '').trim().replace(/\s/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
};

export const planSync = (existing: ExistingSupply[], rows: string[][]): SyncPlan => {
  const byKey = new Map(existing.map((e) => [e.nameKey, e]));
  const seen = new Set<string>();
  const plan: SyncPlan = { create: [], update: [], unchanged: 0, invalid: [] };
  rows.forEach((r, i) => {
    const rowNo = i + 1;
    const [nameRaw = '', unitRaw = '', stockRaw = '', minRaw = ''] = r.map((c) => String(c ?? ''));
    if (i === 0 && supplyKey(nameRaw) === 'insumo') return; // fila de títulos
    if (r.every((c) => String(c ?? '').trim() === '')) return; // fila vacía
    const name = nameRaw.trim();
    if (!name || name.length > 80) return void plan.invalid.push({ row: rowNo, reason: 'Nombre vacío o de más de 80 caracteres' });
    const stock = parseAmount(stockRaw);
    if (Number.isNaN(stock)) return void plan.invalid.push({ row: rowNo, reason: `Stock inválido: «${stockRaw}»` });
    const minStock = minRaw.trim() === '' ? 0 : parseAmount(minRaw);
    if (Number.isNaN(minStock)) return void plan.invalid.push({ row: rowNo, reason: `Mínimo inválido: «${minRaw}»` });
    const key = supplyKey(name);
    if (seen.has(key)) return void plan.invalid.push({ row: rowNo, reason: `Insumo repetido en la planilla: «${name}»` });
    seen.add(key);
    const row: SyncRow = { name, unit: unitRaw.trim().slice(0, 20) || 'unidades', stock, minStock };
    const cur = byKey.get(key);
    if (!cur) return void plan.create.push(row);
    const changes: SyncPlan['update'][number]['changes'] = {};
    if (cur.unit !== row.unit) changes.unit = { from: cur.unit, to: row.unit };
    if (cur.stock !== row.stock) changes.stock = { from: cur.stock, to: row.stock };
    if (cur.minStock !== row.minStock) changes.minStock = { from: cur.minStock, to: row.minStock };
    if (Object.keys(changes).length) plan.update.push({ id: cur._id, name: cur.name, changes, row });
    else plan.unchanged++;
  });
  return plan;
};

/**
 * Lectura real con una cuenta de servicio de Google (solo lectura). Se activa con:
 *   GOOGLE_SHEETS_ID, GOOGLE_SHEETS_RANGE (ej. "Insumos!A:D") y GOOGLE_SERVICE_ACCOUNT_JSON (el JSON de la clave).
 * ⚠️ Sin probar contra Google (faltan credenciales): ver docs/INSUMOS-SHEETS.md.
 */
export class GoogleSheetsSource implements SheetsSource {
  constructor(private readonly sheetId: string, private readonly range: string, private readonly credentials: object) {}

  async readRows(): Promise<string[][]> {
    const auth = new GoogleAuth({ credentials: this.credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const client = await auth.getClient();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.sheetId)}/values/${encodeURIComponent(this.range)}?valueRenderOption=UNFORMATTED_VALUE`;
    const res = await client.request<{ values?: unknown[][] }>({ url });
    return (res.data.values ?? []).map((r) => r.map((c) => String(c ?? '')));
  }
}

let override: SheetsSource | null | undefined;
/** Solo para pruebas: reemplaza la fuente real. */
export const setSheetsSourceForTests = (s: SheetsSource | null | undefined) => { override = s; };

export const getSheetsSource = (): SheetsSource | null => {
  if (override !== undefined) return override;
  const { GOOGLE_SHEETS_ID: id, GOOGLE_SHEETS_RANGE: range, GOOGLE_SERVICE_ACCOUNT_JSON: json } = process.env;
  if (!id || !range || !json) return null;
  try {
    return new GoogleSheetsSource(id, range, JSON.parse(json));
  } catch {
    return null;
  }
};
