'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  /** 0 = "Consultar" */
  price: number;
  imageUrl: string;
  imageHover: string;
  videoUrl: string;
  categoryId: string;
  stock?: number;
}

export interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface StoreSection {
  title: string;
  subtitle: string;
  heroImage: string;
  categories: StoreCategory[];
  products: StoreProduct[];
}

export interface StoreContact {
  whatsapp?: string;
  whatsappDisplay?: string;
  instagram?: string;
  instagramUrl?: string;
  location?: string;
  email?: string;
}

export type SectionKey = 'productosSection' | 'impresorasSection' | 'filamentosSection';

/* ---------- catálogo de respaldo ----------
 * Se usa cuando la API no responde o la sección todavía no tiene productos cargados,
 * para que la página nunca quede vacía. Sin precios: se muestra "Consultar". Lo que cargues
 * en el panel (Inicio web → secciones) siempre tiene prioridad.
 */
const p = (
  id: string,
  categoryId: string,
  name: string,
  description: string,
  image: string,
): StoreProduct => ({
  id,
  categoryId,
  name,
  description,
  price: 0,
  imageUrl: `/demo/${image}.svg`,
  imageHover: '',
  videoUrl: '',
});

export const FALLBACK_SECTIONS: Record<SectionKey, StoreSection> = {
  productosSection: {
    title: 'Productos personalizados',
    subtitle: 'Trofeos, vasos, llaveros y figuras hechos a medida en Corrientes.',
    heroImage: '/demo/hero-productos.svg',
    categories: [
      { id: 'trofeos', name: 'Trofeos y copas' },
      { id: 'llaveros', name: 'Llaveros' },
      { id: 'vasos', name: 'Vasos y mates' },
      { id: 'figuras', name: 'Figuras y deco' },
      { id: 'piezas', name: 'Piezas y repuestos' },
    ],
    products: [
      p('f-trofeo', 'trofeos', 'Trofeo personalizado', 'Con nombre, escudo y año a elección.', 'prod-trofeo'),
      p('f-copa', 'trofeos', 'Copa', 'Réplica con base y placa personalizable.', 'prod-copa'),
      p('f-llavero', 'llaveros', 'Llavero con nombre', 'En PLA, con el nombre o diseño que elijas.', 'prod-llavero'),
      p('f-vaso', 'vasos', 'Vaso personalizado', 'Con el escudo de tu equipo o tu propio diseño.', 'prod-vaso'),
      p('f-mate', 'vasos', 'Mate impreso 3D', 'Mate de diseño propio, listo para usar.', 'prod-mate'),
      p('f-figura', 'figuras', 'Figura coleccionable', 'Figuras articuladas y de colección.', 'prod-figura'),
      p('f-macetero', 'figuras', 'Macetero geométrico', 'Macetero de diseño con plato.', 'prod-macetero'),
      p('f-engranaje', 'piezas', 'Engranajes y piezas', 'Piezas técnicas y repuestos a medida.', 'prod-engranaje'),
    ],
  },
  impresorasSection: {
    title: 'Impresoras 3D',
    subtitle: 'Equipos Bambu Lab, repuestos y accesorios para tu taller.',
    heroImage: '/demo/hero-impresoras.svg',
    categories: [
      { id: 'equipos', name: 'Impresoras' },
      { id: 'repuestos', name: 'Repuestos y accesorios' },
    ],
    products: [
      p('f-x1c', 'equipos', 'Bambu Lab X1 Carbon', 'Cerrada, de alta velocidad, con cámara y soporte multicolor.', 'imp-x1c'),
      p('f-p1s', 'equipos', 'Bambu Lab P1S', 'Cerrada y rápida, pensada para producir todos los días.', 'imp-p1s'),
      p('f-a1', 'equipos', 'Bambu Lab A1 mini', 'Compacta y accesible, ideal para empezar.', 'imp-a1mini'),
      p('f-boquilla', 'repuestos', 'Boquillas y hotends', 'Repuestos para que la impresora siga trabajando.', 'ins-boquilla'),
      p('f-placa', 'repuestos', 'Placas de impresión', 'Placas de repuesto para tu cama caliente.', 'ins-placa'),
      p('f-herr', 'repuestos', 'Herramientas', 'Espátulas y herramientas de taller.', 'ins-herramientas'),
    ],
  },
  filamentosSection: {
    title: 'Filamentos y materiales',
    subtitle: 'PLA, PETG, ABS y TPU en bobinas listas para imprimir.',
    heroImage: '/demo/hero-filamentos.svg',
    categories: [
      { id: 'filamentos', name: 'Filamentos' },
      { id: 'resinas', name: 'Resinas' },
    ],
    products: [
      p('f-pla', 'filamentos', 'Filamento PLA', 'El más fácil de imprimir. Ideal para piezas decorativas.', 'fil-pla'),
      p('f-petg', 'filamentos', 'Filamento PETG', 'Resistente y con algo de flexibilidad. Apto para uso exterior.', 'fil-petg'),
      p('f-abs', 'filamentos', 'Filamento ABS', 'Alta resistencia térmica para piezas técnicas.', 'fil-abs'),
      p('f-tpu', 'filamentos', 'Filamento TPU', 'Flexible, tipo goma. Para fundas, ruedas y juntas.', 'fil-tpu'),
      p('f-resina', 'resinas', 'Resina', 'Resina para impresoras de alta definición.', 'ins-resina'),
    ],
  },
};

/* ---------- normalización de lo que devuelve la API ---------- */
interface RawProduct {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  imageHover?: string;
  videoUrl?: string;
  enabled?: boolean;
  stock?: number;
}
interface RawCategory {
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  products?: RawProduct[];
  subCategories?: Array<{ products?: RawProduct[] }>;
}
interface RawSection {
  title?: string;
  subtitle?: string;
  heroImage?: string;
  categories?: RawCategory[];
}

export function normalizeSection(raw: RawSection | undefined, key: SectionKey): StoreSection {
  const base = FALLBACK_SECTIONS[key];
  const categories: StoreCategory[] = [];
  const products: StoreProduct[] = [];
  let n = 0;

  (raw?.categories ?? []).forEach((cat, ci) => {
    const catId = cat.id || `cat-${ci}`;
    const catName = (cat.name || '').trim();
    if (catName) {
      categories.push({
        id: catId,
        name: catName,
        description: cat.description,
        imageUrl: cat.imageUrl,
      });
    }
    const raws = [...(cat.products ?? []), ...(cat.subCategories ?? []).flatMap((s) => s.products ?? [])];
    raws.forEach((prod) => {
      const name = (prod.name || prod.description || '').trim();
      if (!name && !prod.imageUrl) return;
      if (prod.enabled === false) return;
      n += 1;
      products.push({
        id: prod.id || `p-${n}`,
        name: name || 'Producto',
        description: prod.name ? prod.description || '' : '',
        price: Number(prod.price) || 0,
        imageUrl: prod.imageUrl || '',
        imageHover: prod.imageHover || '',
        videoUrl: prod.videoUrl || '',
        categoryId: catId,
        stock: prod.stock,
      });
    });
  });

  // Sin productos cargados todavía: mostramos el catálogo de respaldo.
  if (products.length === 0) return base;

  return {
    title: raw?.title?.trim() || base.title,
    subtitle: raw?.subtitle?.trim() || base.subtitle,
    heroImage: raw?.heroImage || base.heroImage,
    categories: categories.filter((c) => products.some((pr) => pr.categoryId === c.id)),
    products,
  };
}

export interface UseStoreSection {
  loading: boolean;
  section: StoreSection;
  contact?: StoreContact;
  /** true si se muestra el catálogo de respaldo (API caída o sin productos cargados) */
  isFallback: boolean;
}

export function useStoreSection(key: SectionKey): UseStoreSection {
  const [state, setState] = useState<UseStoreSection>({
    loading: true,
    section: FALLBACK_SECTIONS[key],
    isFallback: true,
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
        setState({ loading: false, section: FALLBACK_SECTIONS[key], isFallback: true });
      }
    })();
    return () => ctrl.abort();
  }, [key]);

  return state;
}
