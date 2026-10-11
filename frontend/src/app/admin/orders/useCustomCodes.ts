import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { CustomCode } from './types';

/**
 * Filas de "Videos por código" (Admin → Inicio web). Definen los tipos de producto
 * que se pueden elegir en un ítem personalizado. `/api/settings` es solo-admin:
 * para un operario la lista queda vacía y se usan los tipos por defecto.
 */
export function useCustomCodes() {
  const [codes, setCodes] = useState<CustomCode[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (!res.ok) return;
      const settings = await res.json();
      const raw = settings?.homepageSections?.customCodes ?? settings?.customCodes ?? [];
      setCodes(Array.isArray(raw) ? raw : []);
    } catch {
      setCodes([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { codes, refresh };
}
