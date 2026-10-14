'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import Nav from '@/components/store/Nav';
import Footer from '@/components/store/Footer';
import { WHATSAPP_PHONE } from '@/lib/config';
import { resolveMediaUrl } from '@/lib/api';
import RevealImage from '@/components/store/RevealImage';
import AddToCart from '@/components/store/AddToCart';
import type { Product } from '@/types';
import type { StoreContact, StoreProduct, StoreSection } from '@/lib/storeCatalog';

interface Props {
  kicker: string;
  section: StoreSection;
  contact?: StoreContact;
  loading?: boolean;
  /** Texto del bloque de cierre ("¿No encontrás lo que buscás?") */
  closing?: string;
}

const formatPrice = (n: number) => `$${n.toLocaleString('es-AR')}`;

/** Producto del catálogo web → ítem del carrito (se coordina por WhatsApp, no por MercadoPago). */
const toCartProduct = (p: StoreProduct, sectionTitle: string, categoryName?: string): Product => ({
  _id: `catalog:${sectionTitle}:${p.id}`,
  name: p.name,
  price: p.price,
  imageUrl: p.imageUrl,
  category: categoryName || '',
  description: p.description,
  stock: p.stock,
  catalog: true,
});

function ProductModal({
  product,
  cartProduct,
  categoryName,
  phone,
  onClose,
}: {
  product: StoreProduct;
  cartProduct: Product;
  categoryName?: string;
  phone: string;
  onClose: () => void;
}) {
  const msg = `Hola, quiero consultar por: ${product.name}${
    product.price > 0 ? ` (${formatPrice(product.price)})` : ''
  }`;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 p-0 md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="store card-hard max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-b-none md:rounded-b-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b-2 border-ink bg-paper-2">
          {product.videoUrl ? (
            <video src={resolveMediaUrl(product.videoUrl)} controls className="aspect-[4/3] w-full bg-ink object-cover" />
          ) : (
            <RevealImage
              src={resolveMediaUrl(product.imageUrl)}
              photo={product.imageHover ? resolveMediaUrl(product.imageHover) : ''}
              alt={product.name}
              className="aspect-[4/3] w-full"
            />
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-white shadow-hard-sm"
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
        <div className="p-6">
          {categoryName && <span className="tag-plain">{categoryName}</span>}
          <h2 className="font-display mt-3 text-3xl uppercase leading-tight">{product.name}</h2>
          {product.description && <p className="mt-2 text-ink-soft">{product.description}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="tag !px-3 !py-1.5 !text-base">
              {product.price > 0 ? formatPrice(product.price) : 'Consultar precio'}
            </span>
            {product.stock === 0 && <span className="tag-plain">Sin stock</span>}
          </div>
          <AddToCart product={cartProduct} className="mt-6" />
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-paper mt-3 w-full"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  cartProduct,
  categoryName,
  phone,
  onOpen,
}: {
  product: StoreProduct;
  cartProduct: Product;
  categoryName?: string;
  phone: string;
  onOpen: () => void;
}) {
  const msg = `Hola, quiero consultar por: ${product.name}`;
  return (
    <article className="card-hard group flex flex-col overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
      <RevealImage
        src={resolveMediaUrl(product.imageUrl)}
        photo={product.imageHover ? resolveMediaUrl(product.imageHover) : ''}
        alt={product.name}
        onOpen={onOpen}
        className="aspect-square w-full border-b-2 border-ink bg-paper-2"
      >
        {categoryName && <span className="tag-plain pointer-events-none absolute left-3 top-3">{categoryName}</span>}
        {product.stock === 0 && (
          <span className="tag pointer-events-none absolute right-3 top-3 !bg-white">Sin stock</span>
        )}
      </RevealImage>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg uppercase leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-snug text-ink-soft">{product.description}</p>
        )}
        <div className="mt-auto space-y-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="tag">{product.price > 0 ? formatPrice(product.price) : 'Consultar'}</span>
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-paper !px-3 !py-1.5 !text-xs"
            >
              WhatsApp
            </a>
          </div>
          <AddToCart product={cartProduct} />
        </div>
      </div>
    </article>
  );
}

export default function CatalogPage({ kicker, section, contact, loading, closing }: Props) {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [open, setOpen] = useState<StoreProduct | null>(null);

  const phone = (contact?.whatsapp || WHATSAPP_PHONE).replace(/\D/g, '');
  const catName = useMemo(
    () => Object.fromEntries(section.categories.map((c) => [c.id, c.name])),
    [section.categories],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return section.products
      .filter((p) => cat === 'all' || p.categoryId === cat)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price;
        if (sort === 'price_desc') return b.price - a.price;
        if (sort === 'name_desc') return b.name.localeCompare(a.name);
        return a.name.localeCompare(b.name);
      });
  }, [section.products, cat, query, sort]);

  return (
    <div className="store min-h-screen">
      <Nav />

      {/* Cabecera */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:px-6 md:py-14">
          <div>
            <span className="tag">{kicker}</span>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,6.4vw,5rem)] uppercase leading-[0.95]">
              {section.title}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">{section.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/cotizar" className="btn btn-signal">
                Cotizar una pieza
              </Link>
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-paper"
              >
                Escribinos
              </a>
            </div>
          </div>
          <div className="card-hard overflow-hidden bg-paper-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(section.heroImage)}
              alt=""
              className="aspect-[3/2] w-full object-contain p-4"
            />
          </div>
        </div>
      </section>

      {/* Filtros */}
      <div className="sticky top-16 z-40 border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Buscar</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={3} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en esta sección"
                className="field !py-2.5 pl-10"
              />
            </label>
            <label>
              <span className="sr-only">Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="field !py-2.5 sm:w-52">
                <option value="name_asc">Nombre A–Z</option>
                <option value="name_desc">Nombre Z–A</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
            </label>
          </div>
          {section.categories.length > 1 && (
            <div className="scrollbar-hide -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {[{ id: 'all', name: 'Todo' }, ...section.categories].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  aria-pressed={cat === c.id}
                  className={`shrink-0 rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    cat === c.id ? 'bg-ink text-paper' : 'bg-white hover:bg-signal'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grilla */}
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <p className="mb-6 text-sm font-bold uppercase tracking-wider text-ink-soft">
          {loading ? 'Cargando…' : `${shown.length} ${shown.length === 1 ? 'producto' : 'productos'}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-hard aspect-[4/5] bg-paper-2" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="card-hard mx-auto max-w-lg p-8 text-center">
            <h2 className="font-display text-2xl uppercase">Sin resultados</h2>
            <p className="mt-2 text-ink-soft">Probá con otra palabra o mirá todo el catálogo.</p>
            <button
              onClick={() => {
                setQuery('');
                setCat('all');
              }}
              className="btn btn-signal mt-5"
            >
              Ver todo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartProduct={toCartProduct(p, section.title, catName[p.categoryId])}
                categoryName={catName[p.categoryId]}
                phone={phone}
                onOpen={() => setOpen(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cierre */}
      <section className="border-t-2 border-ink bg-signal">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-10 md:flex-row md:items-center md:px-6">
          <p className="font-display text-2xl uppercase leading-tight md:text-3xl">
            {closing || '¿No encontrás lo que buscás? Lo hacemos a medida.'}
          </p>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ink shrink-0"
          >
            Hablemos por WhatsApp
          </a>
        </div>
      </section>

      <Footer contact={contact} />

      {open && (
        <ProductModal
          product={open}
          cartProduct={toCartProduct(open, section.title, catName[open.categoryId])}
          categoryName={catName[open.categoryId]}
          phone={phone}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
