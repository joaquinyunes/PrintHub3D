'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { FALLBACK_SECTIONS, normalizeSection } from '@/lib/storeCatalogData';
import type { SectionKey, StoreContact, StoreSection } from '@/lib/storeCatalogData';

export * from '@/lib/storeCatalogData';

export interface UseStoreSection {
  loading: boolean;
  section: StoreSection;
  contact?: StoreContact;
  /** true si se muestra el catálogo de respaldo (API caída o sin productos cargados) */
  isFallback: boolean;
}

/** `initial`: ajustes ya traídos por el servidor; la página sale completa sin esperar a la API. */
export function useStoreSection(key: SectionKey, initial?: Record<string, any>): UseStoreSection {
  const [state, setState] = useState<UseStoreSection>(() => {
    if (initial?.[key]) {
      const section = normalizeSection(initial[key], key);
      return {
        loading: false,
        section,
        contact: initial.contactInfo,
        isFallback: section === FALLBACK_SECTIONS[key],
      };
    }
    return { loading: true, section: FALLBACK_SECTIONS[key], isFallback: true };
  });

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/settings/public'), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const section = normalizeSection(data?.[key], key);
        setState({
          loading: false,
          section,
          contact: data?.contactInfo,
          isFallback: section === FALLBACK_SECTIONS[key],
        });
      } catch {
        if (ctrl.signal.aborted) return;
        // Con datos del servidor ya mostrados no los pisamos con el respaldo.
        setState((s) => (s.loading ? { loading: false, section: FALLBACK_SECTIONS[key], isFallback: true } : s));
      }
    })();
    return () => ctrl.abort();
  }, [key]);

  return state;
}
