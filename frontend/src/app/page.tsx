'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, Instagram, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { WHATSAPP_PHONE, WHATSAPP_DISPLAY } from '@/lib/config';
import { apiUrl } from '@/lib/api';
import HeroSection from '@/components/HeroSection';
import ProductCard from '@/components/ProductCard';
import Nav from '@/components/store/Nav';
import Footer from '@/components/store/Footer';
import { PRINTER_JOURNEY, PRODUCT_JOURNEY } from '@/components/three/journey/presets';
import type { Product } from '@/types';

// Pasillos 3D. Mientras carga reserva la misma altura para que no salte la página.
const ScrollJourney = dynamic(() => import('@/components/three/ScrollJourney'), {
  ssr: false,
  loading: () => <div style={{ height: '670vh' }} className="bg-paper" />,
});

const SECTIONS = [
  {
    href: '/productos',
    title: 'Productos personalizados',
    text: 'Trofeos, vasos, llaveros y figuras hechos a medida.',
    image: '/demo/cat-trofeos.svg',
  },
  {
    href: '/impresoras',
    title: 'Impresoras 3D',
    text: 'Equipos Bambu Lab, repuestos y accesorios.',
    image: '/demo/imp-x1c.svg',
  },
  {
    href: '/filamentos',
    title: 'Filamentos e insumos',
    text: 'PLA, PETG, ABS, TPU y resinas.',
    image: '/demo/fil-pla.svg',
  },
];

interface ContactInfo {
  whatsapp?: string;
  whatsappDisplay?: string;
  instagram?: string;
  instagramUrl?: string;
  location?: string;
  email?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [trackingCode, setTrackingCode] = useState('');
  const [contact, setContact] = useState<ContactInfo | undefined>();
  const [journeysOn, setJourneysOn] = useState({ products: true, printers: true });

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/products/public?tenantId=global3d_hq'), {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        /* sin productos si falla la API */
      }
      try {
        const res = await fetch(apiUrl('/api/settings/public'), { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (data.contactInfo) setContact(data.contactInfo);
        const h = data.homepageSections;
        if (h) {
          setJourneysOn({
            products: h.copaAnimation?.enabled !== false,
            printers: h.impresoraAnimation?.enabled !== false,
          });
        }
      } catch {
        /* se usan los datos por defecto */
      }
    })();
    return () => ctrl.abort();
  }, []);

  const phone = (contact?.whatsapp || WHATSAPP_PHONE).replace(/\D/g, '');

  const handleWhatsAppBuy = (item: { name: string; price: number }) => {
    const text = `Hola, quiero comprar: ${item.name} ($${item.price.toLocaleString('es-AR')}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim();
    if (!code) return;
    router.push(`/track?code=${encodeURIComponent(code)}`);
  };

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) && (filterCategory === 'all' || p.category === filterCategory)
        );
      }),
    [products, searchQuery, filterCategory],
  );

  return (
    <div className="store min-h-screen">
      <Nav onQuote={() => router.push('/cotizar')} />

      <HeroSection />

      {/* Rastreo */}
      <section id="rastreo" className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="font-display text-xl uppercase">¿Ya hiciste un pedido?</h2>
            <p className="text-sm text-ink-soft">Ingresá tu código para ver en qué estado está.</p>
          </div>
          <form onSubmit={handleTrackOrder} className="flex w-full flex-col gap-3 sm:flex-row md:max-w-xl">
            <label className="relative flex-1">
              <span className="sr-only">Código de seguimiento</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                strokeWidth={3}
              />
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ej: joaquin-vasoboca-17032026"
                className="field pl-10"
              />
            </label>
            <button type="submit" disabled={!trackingCode.trim()} className="btn btn-signal disabled:opacity-50">
              Rastrear
            </button>
          </form>
        </div>
      </section>

      {/* Pasillo 1 */}
      {journeysOn.products && (
        <ScrollJourney
          sectionId="pasillo-productos"
          aisle={PRODUCT_JOURNEY.aisle}
          aisleTitle={PRODUCT_JOURNEY.aisleTitle}
          titleLines={PRODUCT_JOURNEY.titleLines}
          intro={PRODUCT_JOURNEY.intro}
          items={PRODUCT_JOURNEY.items}
          outroTitle={PRODUCT_JOURNEY.outroTitle}
          outroText={PRODUCT_JOURNEY.outroText}
          ctas={PRODUCT_JOURNEY.ctas}
        />
      )}

      {/* Secciones */}
      <section id="categorias" className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl uppercase md:text-5xl">
            Elegí tu <span className="marker">sección</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="card-hard group flex flex-col overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full border-b-2 border-ink bg-paper-2 object-contain p-4"
                />
                <div className="flex flex-1 flex-col gap-1 p-5">
                  <h3 className="font-display text-xl uppercase">{s.title}</h3>
                  <p className="text-sm text-ink-soft">{s.text}</p>
                  <span className="mt-3 text-sm font-extrabold uppercase tracking-wide underline-offset-4 group-hover:underline">
                    Ver sección →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo cargado en el panel */}
      {products.length > 0 && (
        <section id="productos" className="border-t-2 border-ink bg-paper-2 px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-3xl uppercase md:text-4xl">Todos los productos</h2>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Buscar productos</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  strokeWidth={3}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos"
                  className="field pl-10"
                />
              </label>
              <label>
                <span className="sr-only">Categoría</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="field sm:w-56"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-10 text-ink-soft">No hay productos con ese filtro.</p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product._id} product={product} handleWhatsAppBuy={handleWhatsAppBuy} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pasillo 2 */}
      {journeysOn.printers && (
        <ScrollJourney
          sectionId="pasillo-impresoras"
          aisle={PRINTER_JOURNEY.aisle}
          aisleTitle={PRINTER_JOURNEY.aisleTitle}
          titleLines={PRINTER_JOURNEY.titleLines}
          intro={PRINTER_JOURNEY.intro}
          items={PRINTER_JOURNEY.items}
          outroTitle={PRINTER_JOURNEY.outroTitle}
          outroText={PRINTER_JOURNEY.outroText}
          ctas={PRINTER_JOURNEY.ctas}
        />
      )}

      {/* Contacto */}
      <section id="contacto" className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-4xl uppercase md:text-5xl">
            Hablemos<span className="marker">.</span>
          </h2>
          <p className="mt-3 text-ink-soft">Respondemos en el día.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="card-hard flex flex-col gap-2 p-5 transition-transform hover:-translate-y-0.5 hover:bg-signal"
            >
              <Phone className="h-6 w-6" strokeWidth={2.5} />
              <h3 className="font-display text-lg uppercase">WhatsApp</h3>
              <p className="text-sm">{contact?.whatsappDisplay || WHATSAPP_DISPLAY}</p>
            </a>
            <a
              href={contact?.instagramUrl || 'https://instagram.com/global3dcorrientes'}
              target="_blank"
              rel="noreferrer"
              className="card-hard flex flex-col gap-2 p-5 transition-transform hover:-translate-y-0.5 hover:bg-signal"
            >
              <Instagram className="h-6 w-6" strokeWidth={2.5} />
              <h3 className="font-display text-lg uppercase">Instagram</h3>
              <p className="text-sm">@{(contact?.instagram || 'global3dcorrientes').replace('@', '')}</p>
            </a>
            <div className="card-hard flex flex-col gap-2 p-5">
              <MapPin className="h-6 w-6" strokeWidth={2.5} />
              <h3 className="font-display text-lg uppercase">Ubicación</h3>
              <p className="text-sm">{contact?.location || 'Corrientes, Argentina'}</p>
            </div>
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="card-hard flex flex-col gap-2 p-5 transition-transform hover:-translate-y-0.5 hover:bg-signal"
              >
                <Mail className="h-6 w-6" strokeWidth={2.5} />
                <h3 className="font-display text-lg uppercase">Email</h3>
                <p className="break-all text-sm">{contact.email}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      <Footer contact={contact} />

      {/* WhatsApp */}
      <a
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-signal fixed bottom-5 right-5 z-40 !px-4 !py-3"
        aria-label="Escribinos por WhatsApp"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={2.6} />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}
