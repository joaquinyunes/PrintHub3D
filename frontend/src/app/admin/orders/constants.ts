import {
  Factory,
  Globe,
  History,
  MessageCircle,
  PackageCheck,
  Store,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { CustomCode, ProductTypeOption, TabId } from './types';

export const ORIGIN_CONFIG: Record<string, { color: string; icon: LucideIcon }> = {
  Local: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Store },
  Instagram: { color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', icon: Globe },
  WhatsApp: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: MessageCircle },
  Facebook: { color: 'text-blue-500 bg-blue-600/10 border-blue-600/20', icon: Globe },
  Web: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Globe },
  Recomendación: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: User },
};
export const ORIGINS = Object.keys(ORIGIN_CONFIG);
export const PAYMENTS = ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'USDT', 'MercadoPago'];

export const TABS: {
  id: TabId;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  statuses: string[];
}[] = [
  {
    id: 'production',
    label: 'EN PRODUCCIÓN',
    description: 'Pendientes y en proceso',
    icon: Factory,
    color: 'text-blue-400',
    statuses: ['pending', 'in_progress'],
  },
  {
    id: 'ready',
    label: 'LISTOS PARA RETIRAR',
    description: 'Finalizados en espera',
    icon: PackageCheck,
    color: 'text-emerald-400',
    statuses: ['completed'],
  },
  {
    id: 'history',
    label: 'HISTORIAL',
    description: 'Entregados y cancelados',
    icon: History,
    color: 'text-gray-400',
    statuses: ['delivered', 'cancelled'],
  },
];

export const STATUSES = [
  { value: 'pending', label: 'PENDIENTE', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  { value: 'in_progress', label: 'EN PROCESO', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { value: 'completed', label: 'TERMINADO', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'delivered', label: 'ENTREGADO', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
  { value: 'cancelled', label: 'CANCELADO', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
];

/** Tipos por defecto si no hay filas en Admin → Inicio → Videos por código. */
const FALLBACK_ORDER_PRODUCT_TYPES: ProductTypeOption[] = [
  { value: 'vasoriver', label: 'Vaso River' },
  { value: 'vasoboca', label: 'Vaso Boca' },
  { value: 'vasoracing', label: 'Vaso Racing' },
  { value: 'vasoindependiente', label: 'Vaso Independiente' },
  { value: 'vasohuracan', label: 'Vaso Huracán' },
  { value: 'porta', label: 'Porta Latas' },
  { value: 'figura', label: 'Figura' },
  { value: 'llavero', label: 'Llavero' },
  { value: 'trofeo', label: 'Trofeo' },
  { value: 'funko', label: 'Funko' },
  { value: 'otro', label: 'Otro' },
];

export function normalizeTypeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

/** Combina tipos definidos en Videos por código (admin) + lista por defecto, sin duplicados. */
export function mergeOrderProductTypes(customCodes: CustomCode[]): ProductTypeOption[] {
  const out: ProductTypeOption[] = [{ value: '', label: 'Sin tipo' }];
  const seen = new Set<string>(['']);

  const push = (value: string, label: string) => {
    const v = String(value || '').trim();
    if (!v) return;
    const key = normalizeTypeKey(v);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ value: v, label: String(label || '').trim() || v });
  };

  if (Array.isArray(customCodes)) {
    for (const row of customCodes) {
      const code = String(row?.code || '').trim();
      if (!code) continue;
      push(code, String(row?.name || '').trim() || code);
    }
  }

  for (const row of FALLBACK_ORDER_PRODUCT_TYPES) {
    push(row.value, row.label);
  }

  return out;
}
